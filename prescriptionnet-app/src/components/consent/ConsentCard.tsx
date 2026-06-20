'use client'

import { useState } from 'react'
import { ShieldCheck, Trash2 } from 'lucide-react'
import type { Consent } from '@/types'
import CountdownTimer from '@/components/dashboard/CountdownTimer'
import Modal from '@/components/ui/Modal'

interface ConsentCardProps {
  consent: Consent
  requesterName: string
  onRevoke: (consentId: string) => void
  showRevoke?: boolean
}

export function ConsentCard({
  consent,
  requesterName,
  onRevoke,
  showRevoke = true,
}: ConsentCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const isActive = consent.status === 'active'
  const isExpired = consent.status === 'expired'
  const isRevoked = consent.status === 'revoked'

  const handleRevoke = () => {
    onRevoke(consent.id)
    setShowConfirm(false)
  }

  const statusLabel = isActive ? 'ACTIVE' : isExpired ? 'EXPIRED' : 'REVOKED'
  const statusClass = isActive
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : isExpired
      ? 'bg-slate-500/15 text-slate-300 border-slate-500/30'
      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'

  return (
    <>
      <div
        className={`rounded-2xl border p-4 ${
          isActive ? 'border-emerald-500/30 bg-slate-900/80' : 'border-slate-700 bg-slate-900/60'
        }`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${isActive ? 'animate-pulse bg-emerald-400' : isExpired ? 'bg-slate-500' : 'bg-rose-400'}`}
              />
              <h4 className="text-base font-semibold text-slate-100">{requesterName}</h4>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {consent.scope} · {consent.purpose}
            </p>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <div className="space-y-2 text-sm text-slate-300">
          <Row label="Granted" value={new Date(consent.grantedAt).toLocaleString()} />
          <Row label="Expires" value={<CountdownTimer expiresAt={consent.expiresAt} compact />} />
          <Row
            label="Signature"
            value={
              <span className="font-mono text-cyan-300">
                Signed: {shorten(consent.patientSignature)}
              </span>
            }
          />
        </div>

        {isActive ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/30 px-3 py-2 text-xs text-cyan-200">
            <ShieldCheck className="h-4 w-4" />
            Secure session active
          </div>
        ) : null}

        {showRevoke && isActive ? (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-950/50"
          >
            <Trash2 className="h-4 w-4" />
            Revoke Access
          </button>
        ) : null}
      </div>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Revoke Access"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRevoke}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Revoke
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          Are you sure? This will immediately terminate access.
        </p>
      </Modal>
    </>
  )
}

function Row({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-right text-sm text-slate-200">{value}</span>
    </div>
  )
}

function shorten(value: string): string {
  return value.length > 16 ? `${value.slice(0, 16)}...` : value
}
