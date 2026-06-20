<<<<<<< HEAD
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
=======
import type { SecureSession } from '@/types'
import { encryptData, generateAESKey, exportAESKey, decryptData, importAESKey } from './crypto'

>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
export async function createSecureSession(
  consentId: string,
  patientId: string,
  requesterId: string,
  patientData: object,
  expiresAt: string
<<<<<<< HEAD
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
=======
): Promise<SecureSession> {
  if (typeof window === 'undefined') {
    throw new Error('Session creation requires browser context')
  }

  try {
    const sessionId = crypto.randomUUID()
    const sessionKey = await generateAESKey()

    const dataString = JSON.stringify(patientData)
    const { encrypted, iv } = await encryptData(sessionKey, dataString)

    const sessionKeyExported = await exportAESKey(sessionKey)

>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
    const session: SecureSession = {
      sessionId,
      consentId,
      requesterId,
      patientId,
<<<<<<< HEAD
      encryptedSessionKey: encryptedKey,
      encryptedData: encrypted,
      iv,
=======
      encryptedSessionKey: sessionKeyExported,
      encryptedPayload: encrypted,
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
      expiresAt,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

<<<<<<< HEAD
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
=======
    // Store with IV separately
    const sessionStorage = {
      ...session,
      iv,
    }

    localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionStorage))

    return session
  } catch (error) {
    console.error('Failed to create secure session:', error)
    throw error
  }
}

>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
export async function accessSecureSession(
  sessionId: string,
  requesterId: string
): Promise<object | null> {
<<<<<<< HEAD
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
=======
  if (typeof window === 'undefined') return null

  try {
    const sessionData = localStorage.getItem(`session_${sessionId}`)
    if (!sessionData) return null

    const session = JSON.parse(sessionData)

    // Verify session is active and not expired
    if (!session.isActive) return null
    if (new Date(session.expiresAt) < new Date()) {
      session.isActive = false
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(session))
      return null
    }

    // Verify requester
    if (session.requesterId !== requesterId) return null

    // Decrypt payload
    const sessionKey = await importAESKey(session.encryptedSessionKey)
    const decrypted = await decryptData(
      session.sessionKey,
      session.encryptedPayload,
      session.iv
    )

    return JSON.parse(decrypted)
  } catch (error) {
    console.error('Failed to access secure session:', error)
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
    return null
  }
}

<<<<<<< HEAD
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
=======
export function isSessionValid(consentId: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const keys = Object.keys(localStorage)
    const sessionKeys = keys.filter((k) => k.startsWith('session_'))

    for (const key of sessionKeys) {
      try {
        const session = JSON.parse(localStorage.getItem(key) || '{}')
        if (session.consentId === consentId) {
          if (
            session.isActive &&
            new Date(session.expiresAt) > new Date()
          ) {
            return true
          }
        }
      } catch {
        // Continue to next session
      }
    }

    return false
  } catch (error) {
    console.error('Failed to check session validity:', error)
    return false
  }
}

export function expireSession(sessionId: string): void {
  if (typeof window === 'undefined') return

  try {
    const session = localStorage.getItem(`session_${sessionId}`)
    if (session) {
      const parsedSession = JSON.parse(session)
      parsedSession.isActive = false
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(parsedSession))
    }
  } catch (error) {
    console.error('Failed to expire session:', error)
  }
}

export function expireAllSessionsForConsent(consentId: string): void {
  if (typeof window === 'undefined') return

  try {
    const keys = Object.keys(localStorage)
    const sessionKeys = keys.filter((k) => k.startsWith('session_'))

    sessionKeys.forEach((key) => {
      try {
        const session = JSON.parse(localStorage.getItem(key) || '{}')
        if (session.consentId === consentId) {
          session.isActive = false
          localStorage.setItem(key, JSON.stringify(session))
        }
      } catch {
        // Continue to next session
      }
    })
  } catch (error) {
    console.error('Failed to expire sessions:', error)
  }
}

export function checkAndExpireOldSessions(): void {
  if (typeof window === 'undefined') return

  try {
    const keys = Object.keys(localStorage)
    const sessionKeys = keys.filter((k) => k.startsWith('session_'))
    const now = new Date()

    sessionKeys.forEach((key) => {
      try {
        const session = JSON.parse(localStorage.getItem(key) || '{}')
        if (session.isActive && new Date(session.expiresAt) <= now) {
          session.isActive = false
          localStorage.setItem(key, JSON.stringify(session))
        }
      } catch {
        // Continue to next session
      }
    })
  } catch (error) {
    console.error('Failed to check and expire old sessions:', error)
  }
}

export function getSessionInfo(consentId: string): SecureSession | null {
  if (typeof window === 'undefined') return null

  try {
    const keys = Object.keys(localStorage)
    const sessionKeys = keys.filter((k) => k.startsWith('session_'))

    for (const key of sessionKeys) {
      try {
        const session = JSON.parse(localStorage.getItem(key) || '{}')
        if (session.consentId === consentId && session.isActive) {
          const { iv, ...sessionInfo } = session
          return sessionInfo
        }
      } catch {
        // Continue to next session
      }
    }

    return null
  } catch (error) {
    console.error('Failed to get session info:', error)
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
    return null
  }
}

<<<<<<< HEAD
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
=======
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
export function getSessionStats(): {
  totalSessions: number
  activeSessions: number
  expiredSessions: number
} {
<<<<<<< HEAD
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
=======
  if (typeof window === 'undefined') {
    return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 }
  }

  try {
    const keys = Object.keys(localStorage)
    const sessionKeys = keys.filter((k) => k.startsWith('session_'))
    let activeSessions = 0
    let expiredSessions = 0

    sessionKeys.forEach((key) => {
      try {
        const session = JSON.parse(localStorage.getItem(key) || '{}')
        if (session.isActive) {
          activeSessions++
        } else {
          expiredSessions++
        }
      } catch {
        // Continue to next session
      }
    })

    return {
      totalSessions: sessionKeys.length,
      activeSessions,
      expiredSessions,
    }
  } catch (error) {
    console.error('Failed to get session stats:', error)
    return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 }
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
  }
}
