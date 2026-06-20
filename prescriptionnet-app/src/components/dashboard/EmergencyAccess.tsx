'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useVault } from '@/hooks/useVault'
import Modal from '@/components/ui/Modal'

interface EmergencyAccessProps {
  patientId: string
}

export function EmergencyAccess({ patientId }: EmergencyAccessProps) {
  const { vaultData, toggleEmergencyAccess } = useVault(patientId)
  const [enabled, setEnabled] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setEnabled(Boolean(vaultData?.emergencyAccessEnabled))
  }, [vaultData])

  const handleToggle = () => {
    if (enabled) {
      void toggleEmergencyAccess(false)
      setEnabled(false)
      return
    }

    setShowConfirm(true)
  }

  const handleEnable = () => {
    void toggleEmergencyAccess(true)
    setEnabled(true)
    setShowConfirm(false)
  }

  return (
    <>
      <div className={`rounded-2xl border p-5 ${enabled ? 'border-rose-500/40 bg-rose-950/20' : 'border-slate-700 bg-slate-900/70'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`rounded-xl p-2 ${enabled ? 'bg-rose-500/15 text-rose-300' : 'bg-slate-800 text-slate-300'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Emergency Access</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                When enabled, any verified doctor can access your full medical history for 1 hour in emergencies.
                All emergency access is logged immediately.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-14 items-center rounded-full border transition ${
              enabled ? 'border-rose-500/40 bg-rose-500' : 'border-slate-600 bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {enabled ? (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/35 px-4 py-3 text-sm text-rose-100">
            <p className="font-semibold">Emergency Access is ACTIVE</p>
            <p className="mt-1">Any verified doctor can access your records.</p>
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Enable Emergency Access?"
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
              onClick={handleEnable}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Confirm Enable
            </button>
          </>
        }
      >
        <p className="text-sm leading-6 text-slate-300">
          This will allow ANY verified doctor to access your complete medical records for emergency purposes.
        </p>
      </Modal>
    </>
  )
}
