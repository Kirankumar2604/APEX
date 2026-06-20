import type { PatientVault, ConsentScope, ConsentDuration, AccessRequest } from '@/types'
import { generateAndStoreKeyPair, getECDSAPrivateKey, getECDSAPublicKey } from './keystore'
import { signConsentAuthorization, verifyConsentSignature, encryptData, generateAESKey, exportAESKey } from './crypto'
import { createConsent, getConsentById, revokeConsent as revokeConsentDb } from './consent'
import { addLedgerEntry, LEDGER_EVENTS } from './ledger'
import { createSecureSession, expireAllSessionsForConsent } from './session'
import { getVault, getVaultByScope } from './vault'
import { addAuditEntry } from './auditLog'

export async function onUserFirstLogin(userId: string): Promise<{
  ecdsaPublicKeyJWK: string
  ecdhPublicKeyJWK: string
}> {
  const keys = await generateAndStoreKeyPair(userId)
  await addLedgerEntry(LEDGER_EVENTS.KEYPAIR_GENERATED, userId, userId, 'N/A')
  return keys
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
  const scopedData = getVaultByScope(patientId, request.scope)
  if (!scopedData) throw new Error('Failed to retrieve vault data')

  const expiresAt = calculateExpiry(request.duration)
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
  const sessionKey = await generateAESKey()
  const sessionKeyExported = await exportAESKey(sessionKey)
  await encryptData(sessionKey, JSON.stringify(scopedData))
  const consent = createConsent(request, signature, sessionKeyExported)
  const session = await createSecureSession(consent.id, patientId, request.requesterId, scopedData, expiresAt)
  addAuditEntry({ consentId: consent.id, patientId, requesterId: request.requesterId, action: 'approved' })
  return { consentId: consent.id, signature, sessionId: session.sessionId, expiresAt }
}

export async function verifyAndGrantAccess(
  consentId: string,
  requesterId: string
): Promise<{ isAuthorized: boolean; data: object | null; reason: string }> {
  const consent = getConsentById(consentId)
  if (!consent) return { isAuthorized: false, data: null, reason: 'Consent not found' }
  if (consent.status !== 'active') return { isAuthorized: false, data: null, reason: 'Consent is not active' }
  if (new Date(consent.expiresAt).getTime() < Date.now()) return { isAuthorized: false, data: null, reason: 'Consent has expired' }
  if (consent.requesterId !== requesterId) return { isAuthorized: false, data: null, reason: 'Requester mismatch' }

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

  const isSignatureValid = await verifyConsentSignature(publicKey, consent.patientSignature, consentData)
  if (!isSignatureValid) return { isAuthorized: false, data: null, reason: 'Signature verification failed' }

  const vault = getVault(consent.patientId)
  if (!vault) return { isAuthorized: false, data: null, reason: 'Vault not found' }

  const scopedData = getDataForScope(vault, consent.scope)
  addAuditEntry({
    consentId,
    patientId: consent.patientId,
    requesterId,
    action: 'viewed',
    dataAccessed: JSON.stringify(scopedData).substring(0, 100),
  })

  return { isAuthorized: true, data: scopedData, reason: 'Access granted' }
}

export async function revokeConsentAuthorization(
  consentId: string,
  patientId: string
): Promise<void> {
  revokeConsentDb(consentId, patientId)
  expireAllSessionsForConsent(consentId)
  await addLedgerEntry(LEDGER_EVENTS.CONSENT_REVOKED, patientId, '', 'N/A')
}

export function calculateExpiry(duration: ConsentDuration): string {
  const now = Date.now()
  switch (duration) {
    case '1 Hour':
      return new Date(now + 3600000).toISOString()
    case '24 Hours':
      return new Date(now + 86400000).toISOString()
    case '7 Days':
      return new Date(now + 604800000).toISOString()
    case 'One-Time':
      return new Date(now + 300000).toISOString()
    default:
      return new Date(now + 86400000).toISOString()
  }
}

export function getDataForScope(vault: PatientVault, scope: ConsentScope): object {
  const result: Record<string, unknown> = {
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
