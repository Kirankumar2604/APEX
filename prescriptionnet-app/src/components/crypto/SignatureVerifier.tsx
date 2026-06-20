'use client'

import { useEffect, useState } from 'react'
import { useCrypto } from '@/hooks/useCrypto'

type SignatureVerifierProps =
  | {
      consentData: object
      patientId: string
      isOpen: boolean
      onVerified: (signature: string) => void
      onFailed: () => void
      onClose: () => void
      onSigned?: never
      onCancel?: never
    }
  | {
      consentData: object
      patientId: string
      onSigned: (signature: string) => void
      onCancel: () => void
      isOpen?: never
      onVerified?: never
      onFailed?: never
      onClose?: never
    }

type Stage = 'signing' | 'verifying' | 'success' | 'failed'

export function SignatureVerifier({
  consentData,
  patientId,
  isOpen,
  onVerified,
  onFailed,
  onClose,
  onSigned,
  onCancel,
}: SignatureVerifierProps) {
  const { signConsent, verifyConsent } = useCrypto()
  const [stage, setStage] = useState<Stage>('signing')
  const [signatureHash, setSignatureHash] = useState('')
  const open = onSigned ? true : Boolean(isOpen)

  useEffect(() => {
    if (!open) return

    const runVerification = async () => {
      try {
        setStage('signing')
        const signature = await signConsent(patientId, consentData)
        setStage('verifying')
        const isValid = await verifyConsent(patientId, signature, consentData)

        if (!isValid) {
          setStage('failed')
          if (onFailed) onFailed()
          return
        }

        setSignatureHash(signature.substring(0, 32).toUpperCase())
        setStage('success')
        if (onVerified) onVerified(signature)
        if (onSigned) onSigned(signature)
      } catch {
        setStage('failed')
        if (onFailed) onFailed()
      }
    }

    void runVerification()
  }, [open, patientId, consentData, signConsent, verifyConsent, onVerified, onFailed, onSigned])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-cyan-500/50 bg-slate-900 p-6 mx-4">
        <h3 className="mb-4 text-lg font-bold text-cyan-400">ECDSA Signature Authorization</h3>

        <div className="mb-6 space-y-4">
          {stage === 'signing' ? (
            <StageRow tone="cyan" text="Signing with ECDSA private key..." />
          ) : null}
          {stage === 'verifying' ? (
            <StageRow tone="blue" text="Verifying signature integrity..." />
          ) : null}
          {stage === 'success' ? (
            <div className="space-y-3">
              <StageRow tone="green" text="Signature verified successfully" />
              <div className="rounded border border-slate-700 bg-slate-800 p-3">
                <p className="mb-1 text-xs text-slate-400">Signature Hash:</p>
                <p className="break-all font-mono text-sm text-cyan-400">{signatureHash}</p>
              </div>
            </div>
          ) : null}
          {stage === 'failed' ? <StageRow tone="red" text="Signature Failed - Access Blocked" /> : null}
        </div>

        <button
          onClick={onClose ?? onCancel}
          className="w-full rounded px-3 py-2 text-slate-100 bg-slate-800 hover:bg-slate-700"
          disabled={stage === 'signing' || stage === 'verifying'}
        >
          {stage === 'success' ? 'Close' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}

export default SignatureVerifier

function StageRow({
  tone,
  text,
}: {
  tone: 'cyan' | 'blue' | 'green' | 'red'
  text: string
}) {
  const toneClass =
    tone === 'cyan'
      ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-100'
      : tone === 'blue'
        ? 'bg-blue-900/30 border-blue-500/50 text-blue-100'
        : tone === 'green'
          ? 'bg-green-900/30 border-green-500/50 text-green-100'
          : 'bg-red-900/30 border-red-500/50 text-red-100'

  return <div className={`flex items-center gap-3 rounded border p-3 ${toneClass}`}>{text}</div>
}
