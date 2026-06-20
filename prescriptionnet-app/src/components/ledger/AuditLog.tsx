'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Download, Eye, FileClock, ShieldOff, X } from 'lucide-react'
import { getAuditLog } from '@/lib/auditLog'

interface AuditLogProps {
  patientId: string
  limit?: number
}

type FilterKey = 'all' | 'approved' | 'viewed' | 'revoked'

export function AuditLog({ patientId, limit = 10 }: AuditLogProps) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [visibleCount, setVisibleCount] = useState(limit)

  const entries = useMemo(() => {
    const list = getAuditLog(patientId)
    if (filter === 'approved') return list.filter((entry) => entry.action === 'approved')
    if (filter === 'viewed') return list.filter((entry) => entry.action === 'viewed')
    if (filter === 'revoked') return list.filter((entry) => entry.action === 'revoked')
    return list
  }, [filter, patientId])

  const visibleEntries = entries.slice(0, visibleCount)

  const exportCsv = () => {
    const rows = [
      ['timestamp', 'action', 'patientId', 'requesterId', 'consentId', 'dataAccessed'],
      ...entries.map((entry) => [
        entry.timestamp,
        entry.action,
        entry.patientId,
        entry.requesterId,
        entry.consentId,
        entry.dataAccessed ?? '',
      ]),
    ]
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `audit-log-${patientId}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Clock3 className="h-5 w-5 text-cyan-300" />
            Audit Log
          </h2>
          <p className="mt-1 text-sm text-slate-500">Detailed audit log of every action in the system.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          <Download className="h-4 w-4" />
          Export as CSV
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ['all', 'All'],
          ['approved', 'Approved'],
          ['viewed', 'Viewed'],
          ['revoked', 'Revoked'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setFilter(key as FilterKey)
              setVisibleCount(limit)
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === key ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {visibleEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-10 text-center text-slate-500">
            No audit entries for this filter.
          </div>
        ) : (
          visibleEntries.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-start gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <Icon action={entry.action} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-100">
                  {describeAction(entry)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span title={new Date(entry.timestamp).toLocaleString()}>{relativeTime(entry.timestamp)}</span>
                  <span className="font-mono text-slate-400">Consent {shorten(entry.consentId)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {entries.length > visibleCount ? (
        <button
          type="button"
          onClick={() => setVisibleCount((current) => current + 10)}
          className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200"
        >
          Load more
        </button>
      ) : null}
    </div>
  )
}

function Icon({ action }: { action: string }) {
  const className = 'h-5 w-5 flex-shrink-0'
  switch (action) {
    case 'requested':
      return <Clock3 className={`${className} text-blue-400`} />
    case 'approved':
      return <CheckCircle2 className={`${className} text-emerald-400`} />
    case 'denied':
      return <X className={`${className} text-rose-400`} />
    case 'viewed':
      return <Eye className={`${className} text-cyan-400`} />
    case 'revoked':
      return <ShieldOff className={`${className} text-orange-400`} />
    case 'expired':
      return <FileClock className={`${className} text-slate-400`} />
    default:
      return <Clock3 className={`${className} text-slate-400`} />
  }
}

function describeAction(entry: ReturnType<typeof getAuditLog>[number]) {
  const actor = entry.requesterId
  if (entry.action === 'viewed') return `${actor} viewed ${entry.dataAccessed ?? 'records'}`
  if (entry.action === 'approved') return `${actor} approved access for ${entry.dataAccessed ?? 'the request'}`
  if (entry.action === 'requested') return `${actor} requested ${entry.dataAccessed ?? 'access'}`
  if (entry.action === 'revoked') return `${actor} revoked access`
  if (entry.action === 'denied') return `${actor} denied access`
  return `${actor} consent expired`
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.floor(diff / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function shorten(value: string) {
  return value.length > 12 ? `${value.slice(0, 12)}...` : value
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}
