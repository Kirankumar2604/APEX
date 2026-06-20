import type { SecureSession } from '@/types'
import { encryptData, generateAESKey, exportAESKey, decryptData, importAESKey } from './crypto'

function readSession(sessionId: string): (SecureSession & { iv?: string }) | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`session_${sessionId}`)
    return raw ? (JSON.parse(raw) as SecureSession & { iv?: string }) : null
  } catch {
    return null
  }
}

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

  const sessionId = crypto.randomUUID()
  const sessionKey = await generateAESKey()
  const { encrypted, iv } = await encryptData(sessionKey, JSON.stringify(patientData))
  const encryptedSessionKey = await exportAESKey(sessionKey)

  const session: SecureSession = {
    sessionId,
    consentId,
    requesterId,
    patientId,
    encryptedSessionKey,
    encryptedPayload: encrypted,
    expiresAt,
    isActive: true,
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem(`session_${sessionId}`, JSON.stringify({ ...session, iv }))
  return session
}

export async function accessSecureSession(
  sessionId: string,
  requesterId: string
): Promise<object | null> {
  if (typeof window === 'undefined') return null

  try {
    const session = readSession(sessionId)
    if (!session) return null
    if (!session.isActive) return null
    if (new Date(session.expiresAt).getTime() < Date.now()) return null
    if (session.requesterId !== requesterId) return null
    if (!session.iv || !session.encryptedPayload) return null

    const sessionKey = await importAESKey(session.encryptedSessionKey)
    const decrypted = await decryptData(sessionKey, session.encryptedPayload, session.iv)
    return JSON.parse(decrypted)
  } catch {
    return null
  }
}

export function isSessionValid(consentId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith('session_'))
      .some((key) => {
        const session = JSON.parse(localStorage.getItem(key) || '{}') as SecureSession
        return session.consentId === consentId && session.isActive && new Date(session.expiresAt).getTime() > Date.now()
      })
  } catch {
    return false
  }
}

export function expireSession(sessionId: string): void {
  if (typeof window === 'undefined') return
  try {
    const session = readSession(sessionId)
    if (!session) return
    session.isActive = false
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session))
  } catch {
    // ignore
  }
}

export function expireAllSessionsForConsent(consentId: string): void {
  if (typeof window === 'undefined') return
  try {
    for (const key of Object.keys(localStorage).filter((storageKey) => storageKey.startsWith('session_'))) {
      const session = JSON.parse(localStorage.getItem(key) || '{}') as SecureSession
      if (session.consentId === consentId) {
        session.isActive = false
        localStorage.setItem(key, JSON.stringify(session))
      }
    }
  } catch {
    // ignore
  }
}

export function checkAndExpireOldSessions(): void {
  if (typeof window === 'undefined') return
  try {
    for (const key of Object.keys(localStorage).filter((storageKey) => storageKey.startsWith('session_'))) {
      const session = JSON.parse(localStorage.getItem(key) || '{}') as SecureSession
      if (session.isActive && new Date(session.expiresAt).getTime() <= Date.now()) {
        session.isActive = false
        localStorage.setItem(key, JSON.stringify(session))
      }
    }
  } catch {
    // ignore
  }
}

export function getSessionInfo(consentId: string): SecureSession | null {
  if (typeof window === 'undefined') return null
  try {
    for (const key of Object.keys(localStorage).filter((storageKey) => storageKey.startsWith('session_'))) {
      const session = JSON.parse(localStorage.getItem(key) || '{}') as SecureSession
      if (session.consentId === consentId && session.isActive) {
        return session
      }
    }
    return null
  } catch {
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
    let activeSessions = 0
    let expiredSessions = 0
    const sessionKeys = Object.keys(localStorage).filter((key) => key.startsWith('session_'))

    for (const key of sessionKeys) {
      const session = JSON.parse(localStorage.getItem(key) || '{}') as SecureSession
      if (session.isActive) activeSessions += 1
      else expiredSessions += 1
    }

    return { totalSessions: sessionKeys.length, activeSessions, expiredSessions }
  } catch {
    return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 }
  }
}
