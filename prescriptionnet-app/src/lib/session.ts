import type { SecureSession } from '@/types'
import { encryptData, generateAESKey, exportAESKey, decryptData, importAESKey } from './crypto'

export async function createSecureSession(
  consentId: string,
  patientId: string,
  requesterId: string,
  patientData: object,
  expiresAt: string
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

    const session: SecureSession = {
      sessionId,
      consentId,
      requesterId,
      patientId,
      encryptedSessionKey: sessionKeyExported,
      encryptedPayload: encrypted,
      expiresAt,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

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

export async function accessSecureSession(
  sessionId: string,
  requesterId: string
): Promise<object | null> {
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
    return null
  }
}

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
    return null
  }
}

export function getSessionStats(): {
  totalSessions: number
  activeSessions: number
  expiredSessions: number
} {
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
  }
}
