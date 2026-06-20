import type { LedgerEntry } from '@/types'

export const LEDGER_EVENTS = {
  ACCESS_REQUESTED: 'ACCESS_REQUESTED',
  CONSENT_GRANTED: 'CONSENT_GRANTED',
  CONSENT_DENIED: 'CONSENT_DENIED',
  CONSENT_REVOKED: 'CONSENT_REVOKED',
  CONSENT_EXPIRED: 'CONSENT_EXPIRED',
  DATA_ACCESSED: 'DATA_ACCESSED',
  EMERGENCY_ACCESS_ENABLED: 'EMERGENCY_ACCESS_ENABLED',
  KEYPAIR_GENERATED: 'KEYPAIR_GENERATED',
  SYSTEM_INITIALIZED: 'SYSTEM_INITIALIZED'
}

export async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)
}

export async function addLedgerEntry(
  eventType: string,
  patientId: string,
  requesterId: string,
  consentScope: string
): Promise<LedgerEntry> {
  if (typeof window === 'undefined') throw new Error('Window undefined')
  const ledger = getLedger()
  const index = ledger.length
  const previousEntry = ledger.length > 0 ? ledger[ledger.length - 1] : null
  const previousHash = previousEntry?.transactionHash || '0x0000000000000000'

  const entryData = JSON.stringify({ index, eventType, patientId, requesterId, consentScope, timestamp: new Date().toISOString() })
  const transactionHash = '0x' + await generateHash(entryData)

  const entry: LedgerEntry = {
    index,
    eventType,
    patientId,
    requesterId,
    consentScope,
    timestamp: new Date().toISOString(),
    transactionHash,
    previousHash
  }
  ledger.push(entry)
  try {
    localStorage.setItem('ledger', JSON.stringify(ledger))
  } catch (e) { console.error('Failed to save ledger:', e) }
  return entry
}

export function getLedger(): LedgerEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('ledger') || '[]')
  } catch { return [] }
}

export function getLedgerForPatient(patientId: string): LedgerEntry[] {
  return getLedger().filter(entry => entry.patientId === patientId)
}

export function getLedgerStats() {
  const ledger = getLedger()
  const stats: Record<string, number> = {}
  ledger.forEach(entry => {
    stats[entry.eventType] = (stats[entry.eventType] || 0) + 1
  })
  return stats
}

export function verifyLedgerIntegrity(): boolean {
  const ledger = getLedger()
  for (let i = 1; i < ledger.length; i++) {
    if (ledger[i].previousHash !== ledger[i - 1].transactionHash) {
      return false
    }
  }
  return true
}
