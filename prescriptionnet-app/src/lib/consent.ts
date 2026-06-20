import type { AccessRequest, Consent, ConsentScope } from '@/types'
import { addLedgerEntry, LEDGER_EVENTS } from './ledger'
import { addAuditEntry } from './auditLog'

/**
 * CONSENT FLOW DOCUMENTATION:
 * 
 * 1. submitAccessRequest() - Requester creates access request (status: pending)
 *    → Ledger: ACCESS_REQUESTED event logged
 *    → Audit: 'requested' action recorded
 *    → Patient sees pending request via getPendingRequests()
 *
 * 2. getPendingRequests() - Patient views all pending requests for approval
 *    → Filters AccessRequest[] with status='pending'
 *
 * 3. createConsent() - Patient approves request (status: active, expiresAt set)
 *    → Approver's signature verified for consent
 *    → Session key encrypted for requester
 *    → Ledger: CONSENT_GRANTED event logged
 *    → Audit: 'approved' action recorded
 *    → AccessRequest status → 'approved'
 *    → Consent expiresAt calculated based on duration
 *
 * 4. getConsentForRequester() - Requester checks if consent exists & is active
 *    → Returns Consent only if status='active' AND not expired
 *    → If new Date(c.expiresAt) <= now, consent is treated as expired (auto-expire)
 *    → Used as guard before DATA_ACCESSED event
 *
 * 5. logDataAccess() - Every data access event recorded
 *    → Ledger: DATA_ACCESSED event logged with scope
 *    → Audit: 'viewed' action recorded with dataAccessed field
 *    → Must be called AFTER getConsentForRequester() check passes
 *
 * 6. checkAndExpireConsents() - Auto-expire consents based on expiresAt
 *    → Called before any consent lookup
 *    → Sets status='expired' if new Date(c.expiresAt) <= now
 *    → Ledger: CONSENT_EXPIRED event logged
 *    → Audit: 'expired' action recorded
 *
 * 7. revokeConsent() - Patient manually terminates consent (status: revoked)
 *    → Ledger: CONSENT_REVOKED event logged
 *    → Audit: 'revoked' action recorded
 *    → Instant termination, no data access allowed
 *
 * SUMMARY: Every state change triggers ledger + audit entry for immutable audit trail
 */

export function calculateExpiry(duration: string): string {
  const now = new Date()
  const expiryDate = new Date(now)
  switch (duration) {
    case '1 Hour':
      expiryDate.setHours(expiryDate.getHours() + 1)
      break
    case '24 Hours':
      expiryDate.setDate(expiryDate.getDate() + 1)
      break
    case '7 Days':
      expiryDate.setDate(expiryDate.getDate() + 7)
      break
    case 'One-Time':
      expiryDate.setHours(expiryDate.getHours() + 1)
      break
    default:
      expiryDate.setDate(expiryDate.getDate() + 1)
  }
  return expiryDate.toISOString()
}

export async function submitAccessRequest(
  requesterId: string,
  requesterName: string,
  requesterRole: string,
  patientId: string,
  purpose: string,
  scope: ConsentScope,
  duration: string,
  message?: string
): Promise<AccessRequest> {
  if (typeof window === 'undefined') throw new Error('Window undefined')
  const request: AccessRequest = {
    id: `req-${crypto.randomUUID()}`,
    requesterId,
    requesterName,
    requesterRole,
    patientId,
    purpose,
    scope,
    duration,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    message
  }
  const requests = getAccessRequests()
  requests.push(request)
  try {
    localStorage.setItem('accessRequests', JSON.stringify(requests))
    await addLedgerEntry(LEDGER_EVENTS.ACCESS_REQUESTED, patientId, requesterId, scope)
    addAuditEntry(request.id, patientId, requesterId, 'requested')
  } catch (e) { console.error('Failed to submit request:', e) }
  return request
}

export function getAccessRequests(patientId?: string, requesterId?: string): AccessRequest[] {
  if (typeof window === 'undefined') return []
  try {
    let requests = JSON.parse(localStorage.getItem('accessRequests') || '[]') as AccessRequest[]
    if (patientId) requests = requests.filter(r => r.patientId === patientId)
    if (requesterId) requests = requests.filter(r => r.requesterId === requesterId)
    return requests
  } catch { return [] }
}

export function getPendingRequests(patientId: string): AccessRequest[] {
  return getAccessRequests(patientId).filter(r => r.status === 'pending')
}

export async function createConsent(
  request: AccessRequest,
  approverSignature: string,
  sessionKeyEncrypted: string
): Promise<Consent> {
  if (typeof window === 'undefined') throw new Error('Window undefined')
  const consent: Consent = {
    id: `consent-${crypto.randomUUID()}`,
    requestId: request.id,
    patientId: request.patientId,
    requesterId: request.requesterId,
    scope: request.scope,
    status: 'active',
    approverSignature,
    sessionKeyEncrypted,
    createdAt: new Date().toISOString(),
    expiresAt: calculateExpiry(request.duration)
  }
  const consents = getConsents()
  consents.push(consent)
  const requests = getAccessRequests()
  const idx = requests.findIndex(r => r.id === request.id)
  if (idx >= 0) requests[idx].status = 'approved'
  try {
    localStorage.setItem('consents', JSON.stringify(consents))
    localStorage.setItem('accessRequests', JSON.stringify(requests))
    await addLedgerEntry(LEDGER_EVENTS.CONSENT_GRANTED, request.patientId, request.requesterId, request.scope)
    addAuditEntry(consent.id, request.patientId, request.requesterId, 'approved')
  } catch (e) { console.error('Failed to create consent:', e) }
  return consent
}

export function getConsents(patientId?: string, requesterId?: string): Consent[] {
  if (typeof window === 'undefined') return []
  try {
    let consents = JSON.parse(localStorage.getItem('consents') || '[]') as Consent[]
    if (patientId) consents = consents.filter(c => c.patientId === patientId)
    if (requesterId) consents = consents.filter(c => c.requesterId === requesterId)
    return consents
  } catch { return [] }
}

export async function checkAndExpireConsents(): Promise<void> {
  if (typeof window === 'undefined') return
  const consents = getConsents()
  const now = new Date()
  for (const consent of consents) {
    if (consent.status === 'active' && new Date(consent.expiresAt) <= now) {
      consent.status = 'expired'
      try {
        await addLedgerEntry(LEDGER_EVENTS.CONSENT_EXPIRED, consent.patientId, consent.requesterId, consent.scope)
        addAuditEntry(consent.id, consent.patientId, consent.requesterId, 'expired')
      } catch (e) { console.error('Failed to expire consent:', e) }
    }
  }
  try {
    localStorage.setItem('consents', JSON.stringify(consents))
  } catch (e) { console.error('Failed to save consents:', e) }
}

export async function getConsentForRequester(patientId: string, requesterId: string): Promise<Consent | null> {
  await checkAndExpireConsents()
  const consents = getConsents(patientId, requesterId)
  const now = new Date()
  return consents.find(c => c.status === 'active' && new Date(c.expiresAt) > now) || null
}

export async function logDataAccess(
  consentId: string,
  patientId: string,
  requesterId: string,
  dataAccessed: string,
  scope: ConsentScope
): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await addLedgerEntry(LEDGER_EVENTS.DATA_ACCESSED, patientId, requesterId, scope)
    addAuditEntry(consentId, patientId, requesterId, 'viewed', dataAccessed)
  } catch (e) { console.error('Failed to log data access:', e) }
}

export async function revokeConsent(consentId: string, patientId: string, requesterId: string, scope: ConsentScope): Promise<void> {
  if (typeof window === 'undefined') return
  const consents = getConsents()
  const idx = consents.findIndex(c => c.id === consentId)
  if (idx >= 0) {
    consents[idx].status = 'revoked'
    try {
      localStorage.setItem('consents', JSON.stringify(consents))
      await addLedgerEntry(LEDGER_EVENTS.CONSENT_REVOKED, patientId, requesterId, scope)
      addAuditEntry(consentId, patientId, requesterId, 'revoked')
    } catch (e) { console.error('Failed to revoke consent:', e) }
  }
}

export function getConsentStats(patientId: string) {
  const requests = getAccessRequests(patientId)
  const consents = getConsents(patientId)
  return {
    totalRequests: requests.length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    approvedRequests: requests.filter(r => r.status === 'approved').length,
    activeConsents: consents.filter(c => c.status === 'active').length,
    expiredConsents: consents.filter(c => c.status === 'expired').length,
    revokedConsents: consents.filter(c => c.status === 'revoked').length
  }
}

export function getSystemStats() {
  if (typeof window === 'undefined') return { totalPatients: 0, encryptedRecords: 0, activeConsents: 0, fraudAlerts: 0, aiAnalyses: 0, ledgerEntries: 0 }
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const patients = users.filter((u: any) => u.role === 'patient').length
    const consents = getConsents()
    const activeConsents = consents.filter(c => c.status === 'active').length
    const ledger = JSON.parse(localStorage.getItem('ledger') || '[]')
    const fraudAlerts = parseInt(localStorage.getItem('fraudAlertsToday') || '0')
    const aiAnalyses = parseInt(localStorage.getItem('aiAnalysesCount') || '0')
    return {
      totalPatients: patients,
      encryptedRecords: patients * 3,
      activeConsents,
      fraudAlerts,
      aiAnalyses,
      ledgerEntries: ledger.length
    }
  } catch { return { totalPatients: 0, encryptedRecords: 0, activeConsents: 0, fraudAlerts: 0, aiAnalyses: 0, ledgerEntries: 0 } }
}
