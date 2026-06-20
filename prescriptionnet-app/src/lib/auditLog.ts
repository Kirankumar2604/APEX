import type { AuditEntry } from '@/types'

export function addAuditEntry(
  consentId: string,
  patientId: string,
  requesterId: string,
  action: 'requested' | 'approved' | 'denied' | 'viewed' | 'revoked' | 'expired',
  dataAccessed?: string
): AuditEntry {
  if (typeof window === 'undefined') return {} as AuditEntry
  const entry: AuditEntry = {
    id: `audit-${crypto.randomUUID()}`,
    consentId,
    patientId,
    requesterId,
    action,
    dataAccessed,
    timestamp: new Date().toISOString()
  }
  const log = getAuditLog()
  log.push(entry)
  try {
    localStorage.setItem('auditLog', JSON.stringify(log))
  } catch (e) { console.error('Failed to save audit log:', e) }
  return entry
}

export function getAuditLog(patientId?: string, requesterId?: string): AuditEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const log = JSON.parse(localStorage.getItem('auditLog') || '[]') as AuditEntry[]
    let filtered = log
    if (patientId) filtered = filtered.filter(e => e.patientId === patientId)
    if (requesterId) filtered = filtered.filter(e => e.requesterId === requesterId)
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch { return [] }
}

export function getAuditLogForConsent(consentId: string): AuditEntry[] {
  return getAuditLog().filter(e => e.consentId === consentId)
}

export function getRecentActivity(patientId: string, limit = 10): AuditEntry[] {
  return getAuditLog(patientId).slice(0, limit)
}
