import type { AuditEntry } from '@/types'

function readAuditLog(): AuditEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('auditLog')
    return raw ? (JSON.parse(raw) as AuditEntry[]) : []
  } catch {
    return []
  }
}

function writeAuditLog(entries: AuditEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('auditLog', JSON.stringify(entries))
  } catch {
    // Ignore storage failures.
  }
}

export function addAuditEntry(
  entry: Omit<AuditEntry, 'id' | 'timestamp'>
): AuditEntry {
  const completeEntry: AuditEntry = {
    ...entry,
    id: `audit-${globalThis.crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
  }

  const auditLog = readAuditLog()
  auditLog.push(completeEntry)
  writeAuditLog(auditLog)
  return completeEntry
}

export function getAuditLog(
  patientId?: string,
  requesterId?: string,
  action?: AuditEntry['action']
): AuditEntry[] {
  return readAuditLog()
    .filter((entry) => (patientId ? entry.patientId === patientId : true))
    .filter((entry) => (requesterId ? entry.requesterId === requesterId : true))
    .filter((entry) => (action ? entry.action === action : true))
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
}

export function getAuditLogForConsent(consentId: string): AuditEntry[] {
  return getAuditLog().filter((entry) => entry.consentId === consentId)
}

export function getRecentActivity(
  patientId: string,
  limit: number = 10
): AuditEntry[] {
  return getAuditLog(patientId).slice(0, limit)
}
