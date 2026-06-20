/**
 * PrescriptionNet — Secure Session Management
 * Creates encrypted data sessions between patients and requesters
 */

import {
  generateAESKey,
  encryptData,
  decryptData,
  encryptSessionKey,
  decryptSessionKey,
  generateSessionId,
} from '@/lib/crypto'

import {
  getECDHPublicKey,
  getECDHPrivateKey,
} from '@/lib/keystore'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface SecureSession {
  sessionId: string
  consentId: string
  requesterId: string
  patientId: string
  encryptedSessionKey: string
  encryptedData: string
  iv: string
  expiresAt: string
  isActive: boolean
  createdAt: string
}

// ═══════════════════════════════════════════════════════
// SESSION CREATION
// ═══════════════════════════════════════════════════════

/**
 * Create an end-to-end encrypted session:
 * 1. Generate AES session key
 * 2. Encrypt patient data with that key
 * 3. Encrypt the session key itself via ECDH for the requester
 * 4. Persist session to localStorage
 */
export async function createSecureSession(
  consentId: string,
  patientId: string,
  requesterId: string,
  patientData: object,
  expiresAt: string
): Promise<{
  sessionId: string
  encryptedData: string
  iv: string
  encryptedSessionKey: string
}> {
  try {
    // 1. Generate a one-time AES-256-GCM session key
    const sessionKey = await generateAESKey()

    // 2. Encrypt the patient data
    const { encrypted, iv } = await encryptData(
      sessionKey,
      JSON.stringify(patientData)
    )

    // 3. Get the ECDH keys for the ECDH key exchange
    const requesterPublicKey = await getECDHPublicKey(requesterId)
    const patientPrivateKey = await getECDHPrivateKey(patientId)

    // 4. Encrypt the session key so only the requester can decrypt it
    const encryptedKey = await encryptSessionKey(
      sessionKey,
      requesterPublicKey,
      patientPrivateKey
    )

    // 5. Build and store the session record
    const sessionId = generateSessionId()
    const session: SecureSession = {
      sessionId,
      consentId,
      requesterId,
      patientId,
      encryptedSessionKey: encryptedKey,
      encryptedData: encrypted,
      iv,
      expiresAt,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session))

    // Also track session in a global index for lookups
    const index: string[] = JSON.parse(
      localStorage.getItem('prescriptionnet_sessions') || '[]'
    )
    index.push(sessionId)
    localStorage.setItem('prescriptionnet_sessions', JSON.stringify(index))

    return { sessionId, encryptedData: encrypted, iv, encryptedSessionKey: encryptedKey }
  } catch (error) {
    throw new Error(
      `Secure session creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ═══════════════════════════════════════════════════════
// SESSION ACCESS (Requester side)
// ═══════════════════════════════════════════════════════

/**
 * Access and decrypt session data (called by the authorized requester).
 * Uses ECDH in the reverse direction to reconstruct the shared secret.
 */
export async function accessSecureSession(
  sessionId: string,
  requesterId: string
): Promise<object | null> {
  try {
    // 1. Load the session
    const session = getActiveSession(sessionId)
    if (!session) return null

    // 2. Verify the session is still valid
    if (!session.isActive) return null
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      expireSession(sessionId)
      return null
    }

    // 3. Verify the requester matches
    if (session.requesterId !== requesterId) return null

    // 4. Get keys for ECDH (reverse direction)
    const requesterPrivateKey = await getECDHPrivateKey(requesterId)
    const patientPublicKey = await getECDHPublicKey(session.patientId)

    // 5. Decrypt the session key
    const sessionKey = await decryptSessionKey(
      session.encryptedSessionKey,
      patientPublicKey,
      requesterPrivateKey
    )

    // 6. Decrypt the patient data
    const plaintext = await decryptData(sessionKey, session.encryptedData, session.iv)

    return JSON.parse(plaintext)
  } catch (error) {
    console.error('Session access failed:', error instanceof Error ? error.message : error)
    return null
  }
}

// ═══════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════

/** Retrieve a session by ID (may be expired) */
export function getActiveSession(sessionId: string): SecureSession | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(`session_${sessionId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SecureSession
  } catch {
    return null
  }
}

/** Mark a single session as expired */
export function expireSession(sessionId: string): void {
  const session = getActiveSession(sessionId)
  if (!session) return
  session.isActive = false
  localStorage.setItem(`session_${sessionId}`, JSON.stringify(session))
}

/** Expire all sessions tied to a specific consent */
export function expireAllSessionsForConsent(consentId: string): void {
  const index: string[] = JSON.parse(
    localStorage.getItem('prescriptionnet_sessions') || '[]'
  )
  for (const sid of index) {
    const session = getActiveSession(sid)
    if (session && session.consentId === consentId) {
      expireSession(sid)
    }
  }
}

/** Walk through all sessions and expire any that have passed their expiresAt */
export function checkAndExpireOldSessions(): void {
  const index: string[] = JSON.parse(
    localStorage.getItem('prescriptionnet_sessions') || '[]'
  )
  const now = Date.now()
  for (const sid of index) {
    const session = getActiveSession(sid)
    if (session && session.isActive && new Date(session.expiresAt).getTime() < now) {
      expireSession(sid)
    }
  }
}

/** Get all sessions belonging to a specific requester */
export function getSessionsForRequester(requesterId: string): SecureSession[] {
  const index: string[] = JSON.parse(
    localStorage.getItem('prescriptionnet_sessions') || '[]'
  )
  const sessions: SecureSession[] = []
  for (const sid of index) {
    const session = getActiveSession(sid)
    if (session && session.requesterId === requesterId) {
      sessions.push(session)
    }
  }
  return sessions
}

/** Get aggregate session statistics */
export function getSessionStats(): {
  totalSessions: number
  activeSessions: number
  expiredSessions: number
} {
  const index: string[] = JSON.parse(
    localStorage.getItem('prescriptionnet_sessions') || '[]'
  )
  let active = 0
  let expired = 0
  const now = Date.now()
  for (const sid of index) {
    const session = getActiveSession(sid)
    if (session) {
      if (session.isActive && new Date(session.expiresAt).getTime() > now) {
        active++
      } else {
        expired++
      }
    }
  }
  return {
    totalSessions: index.length,
    activeSessions: active,
    expiredSessions: expired,
  }
}
