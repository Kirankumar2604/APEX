/*
CONSENT FLOW:
1. Requester submits request  submitAccessRequest()
    status: 'pending', added to localStorage
2. Patient sees pending request  getPendingRequests()
3. Patient signs and approves  createConsent()
    status: 'active', expiresAt calculated
4. Requester accesses data  getConsentForRequester()
    verifies active + not expired
5. Access logged  logDataAccess()
6. Consent expires automatically  checkAndExpireConsents()
   OR Patient revokes  revokeConsent()
7. Every step adds ledger entry & audit entry
*/

import type { AccessRequest, Consent, ConsentDuration, ConsentStatus } from '@/types'
import { addAuditEntry } from './auditLog'
import { addLedgerEntry, LEDGER_EVENTS } from './ledger'

function readArray<T>(storageKey: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function writeArray<T>(storageKey: string, value: T[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    // Ignore storage failures.
  }
}

function getConsentDurationMs(duration: ConsentDuration): number {
  switch (duration) {
    case '1 Hour':
      return 60 * 60 * 1000
    case '24 Hours':
      return 24 * 60 * 60 * 1000
    case '7 Days':
      return 7 * 24 * 60 * 60 * 1000
    case 'One-Time':
      return 5 * 60 * 1000
    default:
      return 60 * 60 * 1000
  }
}

export function submitAccessRequest(
  request: Omit<AccessRequest, 'id' | 'status' | 'requestedAt'>
): AccessRequest {
  const newRequest: AccessRequest = {
    ...request,
    id: `req-${globalThis.crypto.randomUUID()}`,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  }

  const requests = readArray<AccessRequest>('accessRequests')
  requests.push(newRequest)
  writeArray('accessRequests', requests)

  void addLedgerEntry(
    LEDGER_EVENTS.ACCESS_REQUESTED,
    request.patientId,
    request.requesterId,
    request.scope
  )
  addAuditEntry({
    consentId: newRequest.id,
    patientId: request.patientId,
    requesterId: request.requesterId,
    action: 'requested',
    dataAccessed: `${request.purpose} / ${request.scope} / ${request.duration}`,
  })

  return newRequest
}

export function getAccessRequests(
  patientId?: string,
  requesterId?: string
): AccessRequest[] {
  return readArray<AccessRequest>('accessRequests')
    .filter((request) => (patientId ? request.patientId === patientId : true))
    .filter((request) => (requesterId ? request.requesterId === requesterId : true))
}

export function getPendingRequests(patientId: string): AccessRequest[] {
  return getAccessRequests(patientId).filter((request) => request.status === 'pending')
}

export function getRequestById(
  requestId: string
): AccessRequest | null {
  return getAccessRequests().find((request) => request.id === requestId) ?? null
}

export function updateRequestStatus(
  requestId: string,
  status: ConsentStatus
): void {
  const requests = readArray<AccessRequest>('accessRequests')
  const updatedRequests = requests.map((request) =>
    request.id === requestId ? { ...request, status } : request
  )
  writeArray('accessRequests', updatedRequests)
}

export function createConsent(
  request: AccessRequest,
  signature: string,
  sessionKeyEncrypted: string
): Consent {
  const grantedAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + getConsentDurationMs(request.duration)).toISOString()
  const consent: Consent = {
    id: `consent-${globalThis.crypto.randomUUID()}`,
    requestId: request.id,
    patientId: request.patientId,
    requesterId: request.requesterId,
    scope: request.scope,
    purpose: request.purpose,
    duration: request.duration,
    status: 'active',
    grantedAt,
    expiresAt,
    patientSignature: signature,
    sessionKeyEncrypted,
  }

  const consents = readArray<Consent>('consents')
  consents.push(consent)
  writeArray('consents', consents)

  const requests = readArray<AccessRequest>('accessRequests').map((existingRequest) =>
    existingRequest.id === request.id ? { ...existingRequest, status: 'active' } : existingRequest
  )
  writeArray('accessRequests', requests)

  void addLedgerEntry(
    LEDGER_EVENTS.CONSENT_GRANTED,
    request.patientId,
    request.requesterId,
    request.scope
  )
  addAuditEntry({
    consentId: consent.id,
    patientId: request.patientId,
    requesterId: request.requesterId,
    action: 'approved',
    dataAccessed: `${request.purpose} / ${request.scope}`,
  })

  return consent
}

export function denyRequest(
  requestId: string,
  patientId: string
): void {
  const requests = readArray<AccessRequest>('accessRequests')
  const request = requests.find((item) => item.id === requestId)
  if (!request || request.patientId !== patientId) {
    return
  }

  const updatedRequests = requests.map((item) =>
    item.id === requestId ? { ...item, status: 'revoked' } : item
  )
  writeArray('accessRequests', updatedRequests)

  void addLedgerEntry(
    LEDGER_EVENTS.CONSENT_DENIED,
    patientId,
    request.requesterId,
    request.scope
  )
  addAuditEntry({
    consentId: requestId,
    patientId,
    requesterId: request.requesterId,
    action: 'denied',
    dataAccessed: `${request.purpose} / ${request.scope}`,
  })
}

export function getConsents(
  patientId?: string,
  requesterId?: string
): Consent[] {
  return readArray<Consent>('consents')
    .filter((consent) => (patientId ? consent.patientId === patientId : true))
    .filter((consent) => (requesterId ? consent.requesterId === requesterId : true))
}

export function getConsentById(consentId: string): Consent | null {
  return getConsents().find((consent) => consent.id === consentId) ?? null
}

export function checkAndExpireConsents(): void {
  const consents = readArray<Consent>('consents')
  const now = Date.now()
  let changed = false

  const updatedConsents = consents.map((consent) => {
    if (consent.status !== 'active' || new Date(consent.expiresAt).getTime() > now) {
      return consent
    }

    changed = true
    void addLedgerEntry(
      LEDGER_EVENTS.CONSENT_EXPIRED,
      consent.patientId,
      consent.requesterId,
      consent.scope
    )
    addAuditEntry({
      consentId: consent.id,
      patientId: consent.patientId,
      requesterId: consent.requesterId,
      action: 'expired',
      dataAccessed: consent.scope,
    })
    return { ...consent, status: 'expired' as const }
  })

  if (changed) {
    writeArray('consents', updatedConsents)
  }
}

export function getActiveConsents(patientId: string): Consent[] {
  checkAndExpireConsents()
  const now = Date.now()
  return getConsents(patientId).filter(
    (consent) => consent.status === 'active' && new Date(consent.expiresAt).getTime() > now
  )
}

export function getConsentForRequester(
  patientId: string,
  requesterId: string
): Consent | null {
  checkAndExpireConsents()
  const now = Date.now()
  return getConsents(patientId, requesterId).find(
    (consent) => consent.status === 'active' && new Date(consent.expiresAt).getTime() > now
  ) ?? null
}

export function revokeConsent(
  consentId: string,
  patientId: string
): void {
  const consents = readArray<Consent>('consents')
  const consent = consents.find((item) => item.id === consentId)
  if (!consent || consent.patientId !== patientId) {
    return
  }

  const updatedConsents = consents.map((item) =>
    item.id === consentId ? { ...item, status: 'revoked' } : item
  )
  writeArray('consents', updatedConsents)

  void addLedgerEntry(
    LEDGER_EVENTS.CONSENT_REVOKED,
    consent.patientId,
    consent.requesterId,
    consent.scope
  )
  addAuditEntry({
    consentId,
    patientId,
    requesterId: consent.requesterId,
    action: 'revoked',
    dataAccessed: consent.scope,
  })
}

export function logDataAccess(
  consentId: string,
  requesterId: string,
  patientId: string,
  dataAccessed: string
): void {
  const consent = getConsentById(consentId)
  if (!consent) {
    return
  }

  const updatedConsents = getConsents().map((item) =>
    item.id === consentId ? { ...item, lastAccessedAt: new Date().toISOString() } : item
  )
  writeArray('consents', updatedConsents)

  void addLedgerEntry(
    LEDGER_EVENTS.DATA_ACCESSED,
    patientId,
    requesterId,
    consent.scope
  )
  addAuditEntry({
    consentId,
    patientId,
    requesterId,
    action: 'viewed',
    dataAccessed,
  })
}

export function getConsentStats(patientId: string): {
  totalRequests: number
  pendingRequests: number
  activeConsents: number
  revokedConsents: number
  expiredConsents: number
  totalAccesses: number
} {
  const requests = getAccessRequests(patientId)
  const consents = getConsents(patientId)
  const auditLog = readArray<{ patientId: string; action: string }>('auditLog')

  return {
    totalRequests: requests.length,
    pendingRequests: requests.filter((request) => request.status === 'pending').length,
    activeConsents: consents.filter((consent) => consent.status === 'active').length,
    revokedConsents: consents.filter((consent) => consent.status === 'revoked').length,
    expiredConsents: consents.filter((consent) => consent.status === 'expired').length,
    totalAccesses: auditLog.filter(
      (entry) => entry.patientId === patientId && entry.action === 'viewed'
    ).length,
  }
}

export function getSystemStats(): {
  totalPatients: number
  totalEncryptedRecords: number
  activeConsents: number
  fraudAlertsToday: number
  aiAnalysesToday: number
  totalLedgerEntries: number
} {
  const users = readArray<{ role: string }>('users')
  const ledger = readArray<unknown>('ledger')
  const activeConsents = getConsents().filter((consent) => consent.status === 'active').length
  const fraudAlertsRaw = typeof window === 'undefined' ? '0' : localStorage.getItem('fraudAlertsToday') ?? '0'
  const aiAnalysesRaw = typeof window === 'undefined'
    ? '0'
    : localStorage.getItem('aiAnalysesToday') ?? localStorage.getItem('aiAnalysesCount') ?? '0'
  const encryptedRecordCount = typeof window === 'undefined'
    ? 0
    : Object.keys(localStorage)
        .filter((key) => key.startsWith('vault_'))
        .reduce((total, key) => {
          try {
            const raw = localStorage.getItem(key)
            if (!raw) return total
            const vault = JSON.parse(raw) as { prescriptions?: unknown[]; labReports?: unknown[] }
            return total + (vault.prescriptions?.length ?? 0) + (vault.labReports?.length ?? 0)
          } catch {
            return total
          }
        }, 0)

  return {
    totalPatients: users.filter((user) => user.role === 'patient').length,
    totalEncryptedRecords: encryptedRecordCount,
    activeConsents,
    fraudAlertsToday: Number.parseInt(fraudAlertsRaw, 10) || 0,
    aiAnalysesToday: Number.parseInt(aiAnalysesRaw, 10) || 0,
    totalLedgerEntries: ledger.length,
  }
}
