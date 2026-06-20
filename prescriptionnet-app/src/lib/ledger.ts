import type { LedgerEntry } from '@/types'

const ZERO_HASH = '0x0000000000000000'

function readLedger(): LedgerEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('ledger')
    return raw ? (JSON.parse(raw) as LedgerEntry[]) : []
  } catch {
    return []
  }
}

function writeLedger(entries: LedgerEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('ledger', JSON.stringify(entries))
  } catch {
    // Ignore storage failures in constrained environments.
  }
}

export const LEDGER_EVENTS = {
  ACCESS_REQUESTED: 'ACCESS_REQUESTED',
  CONSENT_GRANTED: 'CONSENT_GRANTED',
  CONSENT_DENIED: 'CONSENT_DENIED',
  CONSENT_REVOKED: 'CONSENT_REVOKED',
  CONSENT_EXPIRED: 'CONSENT_EXPIRED',
  DATA_ACCESSED: 'DATA_ACCESSED',
  EMERGENCY_ACCESS_ENABLED: 'EMERGENCY_ACCESS_ENABLED',
  EMERGENCY_ACCESS_DISABLED: 'EMERGENCY_ACCESS_DISABLED',
  EMERGENCY_ACCESS_USED: 'EMERGENCY_ACCESS_USED',
  KEYPAIR_GENERATED: 'KEYPAIR_GENERATED',
} as const

export async function generateHash(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', encoded)
  const hashBytes = Array.from(new Uint8Array(hashBuffer))
  const hexString = hashBytes.map((value) => value.toString(16).padStart(2, '0')).join('')
  return `0x${hexString}`
}

export async function generateTransactionHash(
  entry: Omit<LedgerEntry, 'transactionHash' | 'previousHash' | 'index'>
): Promise<string> {
  return generateHash(JSON.stringify(entry))
}

export async function addLedgerEntry(
  eventType: string,
  patientId: string,
  requesterId: string,
  consentScope: string
): Promise<LedgerEntry> {
  const ledger = readLedger()
  const timestamp = new Date().toISOString()
  const index = ledger.length
  const previousHash = ledger.length > 0 ? ledger[ledger.length - 1].transactionHash : ZERO_HASH
  const transactionHash = await generateTransactionHash({
    eventType,
    patientId,
    requesterId,
    consentScope,
    timestamp,
  })

  const entry: LedgerEntry = {
    index,
    eventType,
    patientId,
    requesterId,
    consentScope,
    timestamp,
    transactionHash,
    previousHash,
  }

  ledger.push(entry)
  writeLedger(ledger)
  return entry
}

export function getLedger(): LedgerEntry[] {
  return readLedger()
}

export function getLedgerForPatient(patientId: string): LedgerEntry[] {
  return getLedger().filter((entry) => entry.patientId === patientId)
}

export function getLedgerStats(): {
  totalEntries: number
  consentsGranted: number
  consentsRevoked: number
  dataAccesses: number
  emergencyAccesses: number
} {
  const ledger = getLedger()
  return {
    totalEntries: ledger.length,
    consentsGranted: ledger.filter((entry) => entry.eventType === LEDGER_EVENTS.CONSENT_GRANTED).length,
    consentsRevoked: ledger.filter((entry) => entry.eventType === LEDGER_EVENTS.CONSENT_REVOKED).length,
    dataAccesses: ledger.filter((entry) => entry.eventType === LEDGER_EVENTS.DATA_ACCESSED).length,
    emergencyAccesses: ledger.filter((entry) =>
      entry.eventType === LEDGER_EVENTS.EMERGENCY_ACCESS_ENABLED ||
      entry.eventType === LEDGER_EVENTS.EMERGENCY_ACCESS_USED ||
      entry.eventType === LEDGER_EVENTS.EMERGENCY_ACCESS_DISABLED
    ).length,
  }
}

export async function verifyLedgerIntegrity(): Promise<{
  isValid: boolean
  brokenAt: number | null
  message: string
}> {
  const ledger = getLedger()
  for (let index = 0; index < ledger.length; index += 1) {
    const entry = ledger[index]
    const expectedHash = await generateTransactionHash({
      eventType: entry.eventType,
      patientId: entry.patientId,
      requesterId: entry.requesterId,
      consentScope: entry.consentScope,
      timestamp: entry.timestamp,
    })

    if (entry.transactionHash !== expectedHash) {
      return {
        isValid: false,
        brokenAt: index,
        message: `Transaction hash mismatch at block #${index + 1}`,
      }
    }

    if (index === 0) {
      if (entry.previousHash !== ZERO_HASH) {
        return {
          isValid: false,
          brokenAt: index,
          message: 'Genesis block has an invalid previous hash',
        }
      }
      continue
    }

    const previousEntry = ledger[index - 1]
    if (entry.previousHash !== previousEntry.transactionHash) {
      return {
        isValid: false,
        brokenAt: index,
        message: `Previous hash mismatch at block #${index + 1}`,
      }
    }
  }

  return {
    isValid: true,
    brokenAt: null,
    message: `Chain valid — all ${ledger.length} blocks verified`,
  }
}
