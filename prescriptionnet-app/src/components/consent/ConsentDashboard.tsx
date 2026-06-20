'use client'

import { useMemo, useState } from 'react'
import { Lock, ShieldCheck, ShieldOff, X } from 'lucide-react'
import { getAllUsers } from '@/lib/mockData'
import { useConsent } from '@/hooks/useConsent'
import { SignatureVerifier } from '@/components/crypto/SignatureVerifier'
import CountdownTimer from '@/components/dashboard/CountdownTimer'
import type { AccessRequest } from '@/types'

interface ConsentDashboardProps {
  patientId: string
}

export function ConsentDashboard({ patientId }: ConsentDashboardProps) {
  const { requests, consents, pendingRequests, activeConsents, denyRequest, revokeConsent, approveRequest } = useConsent(patientId)
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const userMap = useMemo(() => {
    return new Map(getAllUsers().map((user) => [user.id, user]))
  }, [])

  const historyConsents = consents.filter((consent) => consent.status === 'expired' || consent.status === 'revoked')

  const handleVerified = (signature: string) => {
    if (!selectedRequest) return
    approveRequest(selectedRequest, signature)
    setStatusMessage('Access authorized successfully.')
    setSelectedRequest(null)
  }

  return (
    <div className="space-y-6">
      {selectedRequest ? (
        <SignatureVerifier
          consentData={selectedRequest}
          patientId={patientId}
          isOpen={Boolean(selectedRequest)}
          onVerified={handleVerified}
          onFailed={() => {
            setSelectedRequest(null)
            setStatusMessage('Signature verification failed.')
          }}
          onClose={() => setSelectedRequest(null)}
        />
      ) : null}

      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-100">Pending Requests</h2>
          {pendingRequests.length > 0 ? (
            <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-300">
              {pendingRequests.length}
            </span>
          ) : null}
        </div>

        {pendingRequests.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-8 w-8" />}
            title="Your data is fully private"
            subtitle="No pending access requests."
          />
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const requester = userMap.get(request.requesterId)
              return (
                <div key={request.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">{request.requesterName}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {requester?.role ?? request.requesterRole}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                      pending
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Chip>{request.purpose}</Chip>
                    <Chip>{request.scope}</Chip>
                    <Chip>{request.duration}</Chip>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{timeAgo(request.requestedAt)}</p>
                  {request.message ? <p className="mt-3 text-sm leading-6 text-slate-300">{request.message}</p> : null}
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(request)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Authorize Access
                    </button>
                    <button
                      type="button"
                      onClick={() => denyRequest(request.id)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/30 px-4 py-2.5 text-sm font-semibold text-rose-300"
                    >
                      <X className="h-4 w-4" />
                      Deny
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
        <h2 className="text-lg font-semibold text-slate-100">Active Consents</h2>

        {activeConsents.length === 0 ? (
          <EmptyState
            icon={<Lock className="h-8 w-8" />}
            title="No one currently has access to your records"
            subtitle="Your data is fully private."
          />
        ) : (
          <div className="space-y-4">
            {activeConsents.map((consent) => {
              const requester = userMap.get(consent.requesterId)
              return (
                <div key={consent.id} className="rounded-2xl border border-emerald-500/30 border-l-4 border-l-emerald-500 bg-slate-900/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">{requester?.name ?? consent.requesterId}</h3>
                      <p className="mt-1 text-xs text-slate-500">{requester?.role ?? 'requester'}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                      Secure Channel Active
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Chip tone="blue">{consent.scope}</Chip>
                    <Chip tone="cyan">{consent.purpose}</Chip>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-400">Expiry</p>
                    <CountdownTimer expiresAt={consent.expiresAt} compact />
                  </div>
                  <button
                    type="button"
                    onClick={() => revokeConsent(consent.id)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-500/30 px-4 py-2.5 text-sm font-semibold text-rose-300"
                  >
                    <ShieldOff className="h-4 w-4" />
                    Revoke Access
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
        <button
          type="button"
          onClick={() => setShowHistory((previous) => !previous)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Expired / Revoked</h2>
            <p className="mt-1 text-sm text-slate-500">Consent history</p>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
            {showHistory ? 'Collapse' : 'Expand'}
          </span>
        </button>

        {showHistory ? (
          <div className="mt-4 space-y-3">
            {historyConsents.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
                No revoked or expired consents yet.
              </p>
            ) : (
              historyConsents.map((consent) => {
                const requester = userMap.get(consent.requesterId)
                return (
                  <div key={consent.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-100">{requester?.name ?? consent.requesterId}</p>
                        <p className="mt-1 text-xs text-slate-500">{consent.scope}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        consent.status === 'expired'
                          ? 'bg-slate-500/15 text-slate-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}>
                        {consent.status}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : null}
      </section>

      {statusMessage ? (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-3 text-sm text-cyan-200">
          {statusMessage}
        </div>
      ) : null}
    </div>
  )
}

function Chip({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode
  tone?: 'slate' | 'blue' | 'cyan'
}) {
  const classes =
    tone === 'blue'
      ? 'bg-blue-500/15 text-blue-300'
      : tone === 'cyan'
        ? 'bg-cyan-500/15 text-cyan-300'
        : 'bg-slate-800 text-slate-300'
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>{children}</span>
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-slate-300">
        {icon}
      </div>
      <p className="text-base font-semibold text-slate-100">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  )
}

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.floor(diff / 60000))
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
