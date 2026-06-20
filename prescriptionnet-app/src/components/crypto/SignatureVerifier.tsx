'use client'

import { useEffect, useState } from 'react'
import { useCrypto } from '@/hooks/useCrypto'

interface SignatureVerifierProps {
  consentData: object
  patientId: string
  isOpen: boolean
  onVerified: (signature: string) => void
  onFailed: () => void
  onClose: () => void
}

type Stage = 'signing' | 'verifying' | 'success' | 'failed'

export function SignatureVerifier({
  consentData,
  patientId,
  isOpen,
  onVerified,
  onFailed,
  onClose,
}: SignatureVerifierProps) {
  const { signConsent, verifyConsent } = useCrypto()
  const [stage, setStage] = useState<Stage>('signing')
  const [signature, setSignature] = useState('')
  const [signatureHash, setSignatureHash] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const runVerification = async () => {
      try {
        setStage('signing')
        const sig = await signConsent(patientId, consentData)
        setSignature(sig)

        setStage('verifying')
        const isValid = await verifyConsent(patientId, sig, consentData)

        if (isValid) {
          setStage('success')
          setSignatureHash(sig.substring(0, 32).toUpperCase())
          onVerified(sig)
        } else {
          setStage('failed')
          onFailed()
        }
      } catch (error) {
        console.error('Signature verification failed:', error)
        setStage('failed')
        onFailed()
      }
    }

    runVerification()
  }, [isOpen, patientId, consentData, signConsent, verifyConsent, onVerified, onFailed])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg border border-cyan-500/50 p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-cyan-400 mb-4">ECDSA Signature Authorization</h3>

        <div className="space-y-4 mb-6">
          {stage === 'signing' && (
            <div className="flex items-center gap-3 p-3 bg-slate-800 rounded">
              <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-sm text-slate-100">Signing with ECDSA private key...</span>
            </div>
          )}

          {stage === 'verifying' && (
            <div className="flex items-center gap-3 p-3 bg-slate-800 rounded">
              <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-sm text-slate-100">Verifying signature integrity...</span>
            </div>
          )}

          {stage === 'success' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-900/30 rounded border border-green-500/50">
                <span className="text-xl text-green-400">✓</span>
                <span className="text-sm text-green-100">Signature verified successfully</span>
              </div>
              <div className="p-3 bg-slate-800 rounded border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Signature Hash:</p>
                <p className="text-sm font-mono text-cyan-400 break-all">{signatureHash}</p>
              </div>
              <div className="p-3 bg-slate-800 rounded text-xs text-slate-300">
                <p className="font-semibold text-cyan-300 mb-1">Authorization Details</p>
                <p>ECDSA P-256 | Tamper-Proof | Non-Repudiable</p>
              </div>
            </div>
          )}

          {stage === 'failed' && (
            <div className="flex items-center gap-3 p-3 bg-red-900/30 rounded border border-red-500/50">
              <span className="text-xl text-red-400">✗</span>
              <span className="text-sm text-red-100">Signature Failed — Access Blocked</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-slate-100 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            disabled={stage === 'signing' || stage === 'verifying'}
          >
            {stage === 'success' ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
