'use client'

import { useState } from 'react'
import { AlertTriangle, Shield } from 'lucide-react'
import { useVault } from '@/hooks/useVault'

interface EmergencyAccessProps {
  patientId: string
}

export function EmergencyAccess({ patientId }: EmergencyAccessProps) {
  const { vaultData, toggleEmergencyAccess } = useVault(patientId)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isEnabled, setIsEnabled] = useState(
    vaultData?.emergencyAccessEnabled || false
  )

  const handleToggle = () => {
    if (!isEnabled) {
      setShowConfirm(true)
    } else {
      toggleEmergencyAccess(false)
      setIsEnabled(false)
    }
  }

  const handleConfirm = () => {
    toggleEmergencyAccess(true)
    setIsEnabled(true)
    setShowConfirm(false)
  }

  return (
    <>
      <div
        className={`rounded-lg border p-4 transition-all ${
          isEnabled
            ? 'bg-red-900/30 border-red-500/50'
            : 'border-slate-700 bg-slate-800'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {isEnabled ? (
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
            ) : (
              <Shield className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            )}

            <div>
              <h3 className={`font-semibold ${isEnabled ? 'text-red-100' : 'text-slate-100'}`}>
                Emergency Access
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isEnabled
                  ? 'Emergency contacts can access your records during medical emergencies'
                  : 'Allow emergency contacts to access your records during critical situations'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
              isEnabled
                ? 'bg-red-600'
                : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {isEnabled && (
          <div className="mt-3 p-2 bg-red-900/50 rounded text-xs text-red-100 border border-red-500/20">
            <p className="font-semibold mb-1">🚨 Emergency Mode Active</p>
            <p>Authorized emergency contacts can decrypt and view your medical records without time-based consent.</p>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg border border-red-500/50 p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-red-100 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Enable Emergency Access?
            </h3>

            <p className="text-sm text-slate-300 mb-4">
              This allows designated emergency contacts to access your complete medical records
              without waiting for your consent, if you're unable to respond.
            </p>

            <div className="p-3 bg-slate-800 rounded text-xs text-slate-300 mb-4">
              <p className="font-semibold text-slate-100 mb-1">What this means:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Authorized contacts bypass standard consent workflows</li>
                <li>Access is logged in the immutable ledger</li>
                <li>All access is still cryptographically protected</li>
                <li>You can disable this anytime</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-semibold"
              >
                Enable Emergency Access
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
