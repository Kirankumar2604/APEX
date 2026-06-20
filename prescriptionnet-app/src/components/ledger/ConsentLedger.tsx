'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Copy, Link2 } from 'lucide-react'
import { getLedger, getLedgerStats, verifyLedgerIntegrity } from '@/lib/ledger'

interface ConsentLedgerProps {
  patientId?: string
  showAll?: boolean
}

export function ConsentLedger({ patientId, showAll = false }: ConsentLedgerProps) {
  const [verificationMessage, setVerificationMessage] = useState('')
  const [brokenBlock, setBrokenBlock] = useState<number | null>(null)
  const ledgerStats = getLedgerStats()

  const entries = useMemo(() => {
    const list = showAll || !patientId ? getLedger() : getLedger().filter((entry) => entry.patientId === patientId)
    return [...list].reverse()
  }, [patientId, showAll])

  const handleVerify = async () => {
    const result = await verifyLedgerIntegrity()
    setBrokenBlock(result.brokenAt)
    setVerificationMessage(result.message)
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Link2 className="h-5 w-5 text-cyan-300" />
            Consent Ledger
          </h2>
          <p className="mt-1 text-sm text-slate-500">Blockchain-Ready Immutable Audit Trail</p>
        </div>
        <button
          type="button"
          onClick={() => void handleVerify()}
          className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Verify Chain Integrity
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MiniStat label="Total Entries" value={ledgerStats.totalEntries} />
        <MiniStat label="Granted" value={ledgerStats.consentsGranted} />
        <MiniStat label="Revoked" value={ledgerStats.consentsRevoked} />
        <MiniStat label="Accesses" value={ledgerStats.dataAccesses} />
      </div>

      {verificationMessage ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${brokenBlock === null ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200' : 'border-rose-500/30 bg-rose-950/30 text-rose-200'}`}>
          {brokenBlock === null ? (
            <CheckCircle2 className="mr-2 inline-block h-4 w-4" />
          ) : (
            <AlertTriangle className="mr-2 inline-block h-4 w-4" />
          )}
          {verificationMessage}
        </div>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="relative space-y-4 pl-4">
          <div className="absolute bottom-0 left-[18px] top-0 w-px bg-slate-800" />
          {entries.map((entry, index) => (
            <LedgerBlock key={`${entry.index}-${entry.timestamp}`} entry={entry} isLast={index === entries.length - 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function LedgerBlock({
  entry,
  isLast,
}: {
  entry: ReturnType<typeof getLedger>[number]
  isLast: boolean
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(entry.transactionHash)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-[11px] top-5 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_0_6px_rgba(34,211,238,0.12)]" />
      {!isLast ? <div className="absolute left-[15px] top-8 h-full w-px bg-slate-800" /> : null}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-slate-500">#{String(entry.index + 1).padStart(3, '0')}</p>
            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${eventTone(entry.eventType)}`}>
              {entry.eventType}
            </span>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-400">
            Chain link
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Patient" value={shorten(entry.patientId)} />
          <Field label="Requester" value={shorten(entry.requesterId)} />
          <Field label="Scope" value={entry.consentScope} />
          <Field label="Timestamp" value={formatTimestamp(entry.timestamp)} />
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Transaction Hash</p>
              <p className="mt-1 font-mono text-sm text-cyan-300">{shortenHash(entry.transactionHash)}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-3 font-mono text-xs text-slate-500">Previous: {shortenHash(entry.previousHash)}</p>
        </div>
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-200">{value}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-10 text-center text-slate-500">
      No ledger entries yet
    </div>
  )
}

function eventTone(eventType: string) {
  switch (eventType) {
    case 'ACCESS_REQUESTED':
      return 'bg-blue-500/15 text-blue-300'
    case 'CONSENT_GRANTED':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'CONSENT_DENIED':
      return 'bg-rose-500/15 text-rose-300'
    case 'CONSENT_REVOKED':
      return 'bg-orange-500/15 text-orange-300'
    case 'DATA_ACCESSED':
      return 'bg-cyan-500/15 text-cyan-300'
    case 'CONSENT_EXPIRED':
      return 'bg-slate-500/15 text-slate-300'
    case 'EMERGENCY_ACCESS_ENABLED':
    case 'EMERGENCY_ACCESS_USED':
      return 'bg-rose-500/15 text-rose-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

function shorten(value: string) {
  return value.length > 12 ? `${value.slice(0, 12)}...` : value
}

function shortenHash(value: string) {
  return value.length > 24 ? `${value.slice(0, 24)}...` : value
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
