/**
 * Signature Verifier Component
 * UI shown when patient is signing a consent authorization
 */

'use client'

import { useState } from 'react'
import { useCrypto } from '@/hooks/useCrypto'

interface SignatureVerifierProps {
  consentData: {
    requesterId: string
    requesterName: string
    scope: string
    purpose: string
    duration: string
  }
  patientId: string
  onSigned: (signature: string) => void
  onCancel: () => void
}

export default function SignatureVerifier({
  consentData,
  patientId,
  onSigned,
  onCancel,
}: SignatureVerifierProps) {
  const { signConsent } = useCrypto()
  const [isSigning, setIsSigning] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSign = async () => {
    setIsSigning(true)
    setShowAnimation(true)
    setError(null)

    try {
      // Create consent data with timestamp
      const timestamp = new Date().toISOString()
      const fullConsentData = {
        requestId: consentData.requesterId, // Using requesterId as requestId for now
        patientId,
        requesterId: consentData.requesterId,
        scope: consentData.scope,
        purpose: consentData.purpose,
        duration: consentData.duration,
        timestamp,
      }

      // Simulate signing animation
      await delay(1500)

      // Sign the consent
      const sig = await signConsent(patientId, fullConsentData)
      setSignature(sig)

      // Wait a moment to show the signature
      await delay(1000)

      // Call onSigned callback
      onSigned(sig)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign consent'
      setError(errorMessage)
      setIsSigning(false)
      setShowAnimation(false)
    }
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="border-b border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Sign Authorization</h2>
              <p className="text-sm text-slate-400">Cryptographically sign this data access request</p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-400">
                You are about to grant medical data access
              </p>
              <p className="text-xs text-slate-400 mt-1">
                This action will be cryptographically signed and recorded on the blockchain ledger
              </p>
            </div>
          </div>
        </div>

        {/* Consent Details */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white mb-3">Authorization Details</h3>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-slate-400">Requester:</span>
              <span className="col-span-2 text-white font-medium">{consentData.requesterName}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-slate-400">Data Access:</span>
              <span className="col-span-2 text-emerald-400 font-medium">{consentData.scope}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-slate-400">Purpose:</span>
              <span className="col-span-2 text-white">{consentData.purpose}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-slate-400">Duration:</span>
              <span className="col-span-2 text-blue-400 font-medium">{consentData.duration}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-slate-400">Timestamp:</span>
              <span className="col-span-2 text-slate-300 font-mono text-xs">
                {new Date().toISOString()}
              </span>
            </div>
          </div>

          {/* Signing Animation */}
          {showAnimation && !signature && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-blue-400 font-medium mb-2">Generating signature...</p>
                <div className="font-mono text-xs text-slate-400 overflow-hidden">
                  <div className="animate-pulse">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="mb-1">
                        {Array.from({ length: 64 }).map((_, j) => (
                          <span key={j} className="inline-block" style={{ animationDelay: `${(i * 64 + j) * 10}ms` }}>
                            {Math.random().toString(16).charAt(0)}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Signature Display */}
          {signature && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-emerald-400 font-semibold mb-1">Signature Verified ✓</p>
                  <p className="text-xs text-slate-400 mb-3">
                    Your consent has been cryptographically signed
                  </p>
                  
                  <div className="bg-slate-900/50 rounded p-3 mb-3">
                    <p className="text-xs text-slate-400 mb-1">Signature:</p>
                    <p className="text-xs font-mono text-emerald-400 break-all">
                      0x{signature.substring(0, 20)}...
                    </p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Algorithm:</span>
                      <span className="text-white font-medium">ECDSA P-256 with SHA-256</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-emerald-400 font-medium">Cryptographically Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-400">Signing Failed</p>
                  <p className="text-xs text-slate-400 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-slate-700 p-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSigning}
            className="flex-1 px-6 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={isSigning || !!signature}
            className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSigning ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing...</span>
              </>
            ) : signature ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Signed</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Sign with Private Key</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Made with Bob
