import type {
  PatientVault,
  ConsentScope,
  ConsentDuration,
  AccessRequest,
} from '@/types'
import {
  generateAndStoreKeyPair,
  getECDSAPrivateKey,
  getECDSAPublicKey,
} from './keystore'
import {
  signConsentAuthorization,
  verifyConsentSignature,
  encryptData,
  generateAESKey,
  exportAESKey,
} from './crypto'
import { createConsent, getConsentById, revokeConsent as revokeConsentDb, getConsentForRequester } from './consent'
import { addLedgerEntry, LEDGER_EVENTS } from './ledger'
import { createSecureSession, expireAllSessionsForConsent } from './session'
import { getVault, getVaultByScope } from './vault'
import { addAuditEntry } from './auditLog'
import { getAllUsers } from './mockData'

export async function onUserFirstLogin(userId: string): Promise<{
  ecdsaPublicKeyJWK: string
  ecdhPublicKeyJWK: string
}> {
  try {
    const { ecdsaPublicKeyJWK, ecdhPublicKeyJWK } =
      await generateAndStoreKeyPair(userId)

    // Update user publicKey in localStorage
    if (typeof window !== 'undefined') {
      const users = getAllUsers()
      const user = users.find((u) => u.id === userId)
      if (user) {
        user.publicKey = ecdsaPublicKeyJWK
        localStorage.setItem('users', JSON.stringify(users))
      }
    }

    // Add ledger entry
    await addLedgerEntry(LEDGER_EVENTS.KEYPAIR_GENERATED, userId, userId, 'N/A')

    return { ecdsaPublicKeyJWK, ecdhPublicKeyJWK }
  } catch (error) {
    console.error('Failed to initialize on first login:', error)
    throw error
  }
}

export async function patientAuthorizeAccess(
  patientId: string,
  request: AccessRequest
): Promise<{
  consentId: string
  signature: string
  sessionId: string
  expiresAt: string
}> {
  try {
    // 1. Get patient vault data matching request.scope
    const scopedData = getVaultByScope(patientId, request.scope)
    if (!scopedData) {
      throw new Error('Failed to retrieve vault data')
    }

    // 2. Calculate expiresAt from duration
    const expiresAt = calculateExpiry(request.duration)

    // 3. Sign consent data with ECDSA private key
    const consentData = {
      requestId: request.id,
      patientId,
      requesterId: request.requesterId,
      scope: request.scope,
      purpose: request.purpose,
      duration: request.duration,
      expiresAt,
    }

    const privateKey = await getECDSAPrivateKey(patientId)
    const signature = await signConsentAuthorization(privateKey, consentData)

    // 4. Create secure session with encrypted vault data
    const sessionKey = await generateAESKey()
    const sessionKeyExported = await exportAESKey(sessionKey)

    const dataString = JSON.stringify(scopedData)
    const { encrypted, iv } = await encryptData(sessionKey, dataString)

    // Create consent record
    const consent = createConsent(request, signature, sessionKeyExported)

    // Store session
    const session = await createSecureSession(
      consent.id,
      patientId,
      request.requesterId,
      scopedData,
      expiresAt
    )

    // Log audit entry
    addAuditEntry({
      consentId: consent.id,
      patientId,
      requesterId: request.requesterId,
      action: 'approved',
    })

    return {
      consentId: consent.id,
      signature,
      sessionId: session.sessionId,
      expiresAt,
    }
  } catch (error) {
    console.error('Failed to authorize access:', error)
    throw error
  }
}

export async function verifyAndGrantAccess(
  consentId: string,
  requesterId: string
): Promise<{ isAuthorized: boolean; data: object | null; reason: string }> {
  try {
    // 1. Get consent, check status=active, not expired, requesterId matches
    const consent = getConsentById(consentId)
    if (!consent) {
      return { isAuthorized: false, data: null, reason: 'Consent not found' }
    }

    if (consent.status !== 'active') {
      return { isAuthorized: false, data: null, reason: 'Consent is not active' }
    }

    if (new Date(consent.expiresAt) < new Date()) {
      return { isAuthorized: false, data: null, reason: 'Consent has expired' }
    }

    if (consent.requesterId !== requesterId) {
      return { isAuthorized: false, data: null, reason: 'Requester mismatch' }
    }

    // 2. Verify ECDSA signature
    const publicKey = await getECDSAPublicKey(consent.patientId)
    const consentData = {
      requestId: consent.requestId,
      patientId: consent.patientId,
      requesterId: consent.requesterId,
      scope: consent.scope,
      purpose: consent.purpose,
      duration: consent.duration,
      expiresAt: consent.expiresAt,
    }

    const isSignatureValid = await verifyConsentSignature(
      publicKey,
      consent.patientSignature,
      consentData
    )

    if (!isSignatureValid) {
      return {
        isAuthorized: false,
        data: null,
        reason: 'Signature verification failed',
      }
    }

    // 3. Return data (would normally be decrypted from session)
    const vault = getVault(consent.patientId)
    if (!vault) {
      return { isAuthorized: false, data: null, reason: 'Vault not found' }
    }

    const scopedData = getDataForScope(vault, consent.scope)

    // 4. Log data access
    addAuditEntry({
      consentId,
      patientId: consent.patientId,
      requesterId,
      action: 'viewed',
      dataAccessed: JSON.stringify(scopedData).substring(0, 100),
    })

    return { isAuthorized: true, data: scopedData, reason: 'Access granted' }
  } catch (error) {
    console.error('Failed to verify and grant access:', error)
    return { isAuthorized: false, data: null, reason: 'Verification error' }
  }
}

export async function revokeConsentAuthorization(
  consentId: string,
  patientId: string
): Promise<void> {
  try {
    revokeConsentDb(consentId, patientId)
    expireAllSessionsForConsent(consentId)
    await addLedgerEntry(LEDGER_EVENTS.CONSENT_REVOKED, patientId, '', 'N/A')
  } catch (error) {
    console.error('Failed to revoke consent:', error)
    throw error
  }
}

export function calculateExpiry(duration: ConsentDuration): string {
  const now = new Date()

  switch (duration) {
    case '1 Hour':
      return new Date(now.getTime() + 3600000).toISOString()
    case '24 Hours':
      return new Date(now.getTime() + 86400000).toISOString()
    case '7 Days':
      return new Date(now.getTime() + 604800000).toISOString()
    case 'One-Time':
      return new Date(now.getTime() + 300000).toISOString()
    default:
      return new Date(now.getTime() + 86400000).toISOString()
  }
}

export function getDataForScope(vault: PatientVault, scope: ConsentScope): object {
  const result: any = {
    patientId: vault.patientId,
    patientName: vault.patientName,
  }

  if (scope === 'Full Medical History' || scope === 'Prescriptions Only') {
    result.prescriptions = vault.prescriptions
    result.medicationHistory = vault.medicationHistory
  }

  if (scope === 'Full Medical History' || scope === 'Lab Reports Only') {
    result.labReports = vault.labReports
  }

  if (scope === 'Full Medical History' || scope === 'Allergies Only') {
    result.allergies = vault.allergies
  }

  if (scope === 'Full Medical History') {
    result.dateOfBirth = vault.dateOfBirth
    result.bloodGroup = vault.bloodGroup
    result.conditions = vault.conditions
  }

  return result
}
