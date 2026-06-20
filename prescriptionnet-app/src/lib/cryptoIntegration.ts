/**
 * PrescriptionNet — Crypto Integration Layer
 * Glue connecting the crypto engine to the consent, vault, and ledger systems
 */

import {
  signConsentAuthorization,
  verifyConsentSignature,
  sha256Hash,
  generateId,
} from '@/lib/crypto'

import {
  generateAndStoreKeyPair,
  hasKeyPair,
  getECDSAPrivateKey,
  getECDSAPublicKey,
} from '@/lib/keystore'

import {
  createSecureSession,
  accessSecureSession,
  expireAllSessionsForConsent,
} from '@/lib/session'

import type { AccessRequest, PatientVault, Consent } from '@/types'
import { getVaultByPatientId } from '@/data/mockData'

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

/** Convert a duration label to an absolute ISO expiry timestamp */
export function calculateExpiry(duration: string): string {
  const now = Date.now()
  switch (duration) {
    case '1 Hour':
      return new Date(now + 3600000).toISOString()
    case '24 Hours':
      return new Date(now + 86400000).toISOString()
    case '7 Days':
      return new Date(now + 604800000).toISOString()
    case 'One-Time':
      return new Date(now + 60000).toISOString()
    default:
      return new Date(now + 3600000).toISOString()
  }
}

/** Extract the appropriate slice of patient vault based on requested scope */
export function getDataForScope(vault: PatientVault, scope: string): object {
  switch (scope) {
    case 'Prescriptions Only':
      return { prescriptions: vault.prescriptions }
    case 'Lab Reports Only':
      return { labReports: vault.labReports }
    case 'Allergies Only':
      return { allergies: vault.allergies }
    case 'Full Medical History':
      return { ...vault }
    default:
      return { prescriptions: vault.prescriptions }
  }
}

// ═══════════════════════════════════════════════════════
// LEDGER HELPERS (localStorage-based audit trail)
// ═══════════════════════════════════════════════════════

async function addLedgerEntry(
  eventType: string,
  patientId: string,
  requesterId: string,
  consentScope: string
): Promise<void> {
  try {
    const ledger = JSON.parse(localStorage.getItem('prescriptionnet_ledger') || '[]')
    const previousHash =
      ledger.length > 0
        ? ledger[ledger.length - 1].transactionHash
        : '0x0000000000000000000000000000000000000000000000000000000000000000'
    const entryData = `${eventType}|${patientId}|${requesterId}|${consentScope}|${new Date().toISOString()}|${previousHash}`
    const transactionHash = await sha256Hash(entryData)
    ledger.push({
      index: ledger.length,
      eventType,
      patientId,
      requesterId,
      consentScope,
      timestamp: new Date().toISOString(),
      transactionHash,
      previousHash,
    })
    localStorage.setItem('prescriptionnet_ledger', JSON.stringify(ledger))
  } catch (error) {
    console.error('Ledger entry failed:', error)
  }
}

function logDataAccess(
  consentId: string,
  requesterId: string,
  patientId: string,
  scope: string
): void {
  addLedgerEntry('DATA_ACCESSED', patientId, requesterId, scope)
}

// ═══════════════════════════════════════════════════════
// USER FIRST LOGIN — KEY INITIALIZATION
// ═══════════════════════════════════════════════════════

/**
 * Called on first login: ensures the user has a crypto key pair.
 * If not, generates one, stores it, and returns the public keys.
 */
export async function onUserFirstLogin(userId: string): Promise<{
  ecdsaPublicKeyJWK: string
  ecdhPublicKeyJWK: string
}> {
  try {
    if (!hasKeyPair(userId)) {
      const keys = await generateAndStoreKeyPair(userId)
      await addLedgerEntry('KEYPAIR_GENERATED', userId, 'system', 'N/A')
      return keys
    }
    // Key pair already exists — return existing public keys
    const { getPublicKeys } = await import('@/lib/keystore')
    const existing = getPublicKeys(userId)
    if (!existing) throw new Error('Key pair marked present but could not be loaded')
    return {
      ecdsaPublicKeyJWK: existing.ecdsaPublicKey,
      ecdhPublicKeyJWK: existing.ecdhPublicKey,
    }
  } catch (error) {
    throw new Error(
      `First-login key init failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ═══════════════════════════════════════════════════════
// PATIENT AUTHORIZES ACCESS
// ═══════════════════════════════════════════════════════

/**
 * Full workflow when a patient clicks "Authorize Access":
 * 1. Fetch scoped vault data
 * 2. Calculate expiry
 * 3. Sign the consent with ECDSA
 * 4. Create an encrypted session
 * 5. Persist the consent record
 * 6. Emit ledger entry
 */
export async function patientAuthorizeAccess(
  patientId: string,
  request: AccessRequest
): Promise<{
  consentId: string
  signature: string
  sessionId: string
  expiresAt: string
  encryptedSessionKey: string
}> {
  try {
    // 1. Fetch the patient vault data for the requested scope
    const vault = getVaultByPatientId(patientId)
    if (!vault) throw new Error('Patient vault not found')
    const scopedData = getDataForScope(vault, request.scope)

    // 2. Calculate when this consent expires
    const expiresAt = calculateExpiry(request.duration)

    // 3. Build canonical consent data and sign it
    const timestamp = new Date().toISOString()
    const consentData = {
      requestId: request.id,
      patientId,
      requesterId: request.requesterId,
      scope: request.scope,
      purpose: request.purpose,
      duration: request.duration,
      timestamp,
    }
    const privateKey = await getECDSAPrivateKey(patientId)
    const signature = await signConsentAuthorization(privateKey, consentData)

    // 4. Create an encrypted session so the requester can access data
    const consentId = `consent-${generateId()}`
    const sessionResult = await createSecureSession(
      consentId,
      patientId,
      request.requesterId,
      scopedData,
      expiresAt
    )

    // 5. Persist the consent record
    const consent: Consent = {
      id: consentId,
      requestId: request.id,
      patientId,
      requesterId: request.requesterId,
      scope: request.scope as Consent['scope'],
      purpose: request.purpose as Consent['purpose'],
      duration: request.duration as Consent['duration'],
      status: 'active',
      grantedAt: timestamp,
      expiresAt,
      patientSignature: signature,
      sessionKeyEncrypted: sessionResult.encryptedSessionKey,
    }

    const consents: Consent[] = JSON.parse(
      localStorage.getItem('prescriptionnet_consents') || '[]'
    )
    consents.push(consent)
    localStorage.setItem('prescriptionnet_consents', JSON.stringify(consents))

    // Mark the access request as active
    const requests: AccessRequest[] = JSON.parse(
      localStorage.getItem('prescriptionnet_requests') || '[]'
    )
    const reqIdx = requests.findIndex((r) => r.id === request.id)
    if (reqIdx !== -1) {
      requests[reqIdx].status = 'active'
      localStorage.setItem('prescriptionnet_requests', JSON.stringify(requests))
    }

    // 6. Ledger
    await addLedgerEntry('CONSENT_GRANTED', patientId, request.requesterId, request.scope)

    return {
      consentId,
      signature,
      sessionId: sessionResult.sessionId,
      expiresAt,
      encryptedSessionKey: sessionResult.encryptedSessionKey,
    }
  } catch (error) {
    throw new Error(
      `Patient authorize access failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ═══════════════════════════════════════════════════════
// VERIFY & GRANT ACCESS (Requester side)
// ═══════════════════════════════════════════════════════

/**
 * Called when a requester/doctor attempts to access data:
 * 1. Verify the consent status & signature
 * 2. Decrypt the session data
 * 3. Log access to ledger
 */
export async function verifyAndGrantAccess(
  consentId: string,
  requesterId: string
): Promise<{ isAuthorized: boolean; data: object | null; reason: string }> {
  try {
    // 1. Load consent
    const consents: Consent[] = JSON.parse(
      localStorage.getItem('prescriptionnet_consents') || '[]'
    )
    const consent = consents.find((c) => c.id === consentId)
    if (!consent) {
      return { isAuthorized: false, data: null, reason: 'Consent not found' }
    }

    // 2. Check status
    if (consent.status !== 'active') {
      return { isAuthorized: false, data: null, reason: `Consent status is "${consent.status}"` }
    }

    // 3. Check expiry
    if (new Date(consent.expiresAt).getTime() < Date.now()) {
      return { isAuthorized: false, data: null, reason: 'Consent has expired' }
    }

    // 4. Check requester matches
    if (consent.requesterId !== requesterId) {
      return { isAuthorized: false, data: null, reason: 'Requester ID mismatch' }
    }

    // 5. Verify the ECDSA signature
    const publicKey = await getECDSAPublicKey(consent.patientId)
    const consentData = {
      requestId: consent.requestId,
      patientId: consent.patientId,
      requesterId: consent.requesterId,
      scope: consent.scope,
      purpose: consent.purpose,
      duration: consent.duration,
      timestamp: consent.grantedAt,
    }
    const isValid = await verifyConsentSignature(
      publicKey,
      consent.patientSignature,
      consentData
    )
    if (!isValid) {
      return { isAuthorized: false, data: null, reason: 'Signature verification failed' }
    }

    // 6. Find the session and decrypt data
    const sessionIndex: string[] = JSON.parse(
      localStorage.getItem('prescriptionnet_sessions') || '[]'
    )
    let decryptedData: object | null = null
    for (const sid of sessionIndex) {
      const raw = localStorage.getItem(`session_${sid}`)
      if (raw) {
        const session = JSON.parse(raw)
        if (session.consentId === consentId) {
          decryptedData = await accessSecureSession(sid, requesterId)
          break
        }
      }
    }

    if (!decryptedData) {
      return { isAuthorized: false, data: null, reason: 'Session data could not be decrypted' }
    }

    // 7. Log access
    logDataAccess(consentId, requesterId, consent.patientId, consent.scope)

    return { isAuthorized: true, data: decryptedData, reason: 'Access granted' }
  } catch (error) {
    return {
      isAuthorized: false,
      data: null,
      reason: `Access verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// ═══════════════════════════════════════════════════════
// CONSENT REVOCATION
// ═══════════════════════════════════════════════════════

/** Revoke a consent: mark it as revoked, expire all related sessions, log to ledger */
export async function revokeConsent(
  consentId: string,
  patientId: string
): Promise<void> {
  try {
    // Revoke in consent store
    const consents: Consent[] = JSON.parse(
      localStorage.getItem('prescriptionnet_consents') || '[]'
    )
    const idx = consents.findIndex((c) => c.id === consentId)
    if (idx !== -1) {
      const requesterId = consents[idx].requesterId
      const scope = consents[idx].scope
      consents[idx].status = 'revoked'
      localStorage.setItem('prescriptionnet_consents', JSON.stringify(consents))

      // Expire all sessions for this consent
      expireAllSessionsForConsent(consentId)

      // Ledger entry
      await addLedgerEntry('CONSENT_REVOKED', patientId, requesterId, scope)
    }
  } catch (error) {
    throw new Error(
      `Consent revocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
