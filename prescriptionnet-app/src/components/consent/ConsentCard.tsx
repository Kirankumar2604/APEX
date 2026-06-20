'use client'

import { useState } from 'react'
import type { Consent } from '@/types'
import { Lock, Trash2 } from 'lucide-react'

interface ConsentCardProps {
  consent: Consent
  requesterName: string
  onRevoke: (id: string) => void
  showRevoke?: boolean
}

export function ConsentCard({
  consent,
  requesterName,
  onRevoke,
  showRevoke = true,
}: ConsentCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleRevoke = () => {
    onRevoke(consent.id)
    setShowConfirm(false)
  }

  const isExpired = new Date(consent.expiresAt) < new Date()
  const isRevoked = consent.status === 'revoked'

  const statusColor = isExpired
    ? 'bg-slate-800'
    : isRevoked
      ? 'bg-red-900/30'
      : 'bg-green-900/30'

  const statusText = isExpired
    ? 'Expired'
    : isRevoked
      ? 'Revoked'
      : 'Active'

  const statusBadgeColor = isExpired
    ? 'bg-slate-700 text-slate-300'
    : isRevoked
      ? 'bg-red-700 text-red-100'
      : 'bg-green-700 text-green-100'

  return (
    <>
      <div className={`rounded-lg border ${isExpired ? 'border-slate-700' : isRevoked ? 'border-red-500/30' : 'border-green-500/30'} p-4 ${statusColor}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-slate-100">{requesterName}</h4>
            <p className="text-xs text-slate-400 mt-1">
              {consent.purpose} • {consent.scope}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded font-medium ${statusBadgeColor}`}
          >
            {statusText}
          </span>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-slate-400">Granted:</span>
            <span className="text-slate-200">
              {new Date(consent.grantedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Expires:</span>
            <span className={isExpired ? 'text-red-300' : 'text-slate-200'}>
              {new Date(consent.expiresAt).toLocaleDateString()}
              {' '}
              {new Date(consent.expiresAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Duration:</span>
            <span className="text-slate-200">{consent.duration}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 p-2 bg-slate-900/50 rounded">
          <Lock className="w-3 h-3" />
          <span>Signature verified • Non-repudiable</span>
        </div>

        {showRevoke && !isRevoked && !isExpired && (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full px-3 py-2 text-sm bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-100 rounded transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Revoke Consent
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg border border-red-500/50 p-6 max-w-sm">
            <h3 className="text-lg font-bold text-red-100 mb-2">
              Revoke Consent?
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              This will immediately terminate {requesterName}'s access to your
              medical records.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-semibold"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
