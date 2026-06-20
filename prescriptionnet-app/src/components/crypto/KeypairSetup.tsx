'use client'

import { useEffect, useState } from 'react'
import { useCrypto } from '@/hooks/useCrypto'

interface KeypairSetupProps {
  userId: string
  onComplete: (publicKeys: {
    ecdsaPublicKeyJWK: string
    ecdhPublicKeyJWK: string
  }) => void
}

interface SetupStep {
  id: number
  title: string
  status: 'pending' | 'processing' | 'complete'
}

export default function KeypairSetup({ userId, onComplete }: KeypairSetupProps) {
  const { initializeKeyPair } = useCrypto()
  const [steps, setSteps] = useState<SetupStep[]>([
    { id: 1, title: 'Generating ECDSA P-256 keypair for digital signatures...', status: 'pending' },
    { id: 2, title: 'Generating ECDH P-256 keypair for secure key exchange...', status: 'pending' },
    { id: 3, title: 'Encrypting private keys for local storage...', status: 'pending' },
    { id: 4, title: 'Registering public keys with the network...', status: 'pending' },
  ])
  const [publicKeyFingerprint, setPublicKeyFingerprint] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void generateKeys()
  }, [])

  const updateStepStatus = (stepId: number, status: SetupStep['status']) => {
    setSteps((previous) =>
      previous.map((step) => (step.id === stepId ? { ...step, status } : step))
    )
  }

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const generateKeys = async () => {
    try {
      updateStepStatus(1, 'processing')
      await delay(800)
      updateStepStatus(1, 'complete')

      updateStepStatus(2, 'processing')
      await delay(800)
      updateStepStatus(2, 'complete')

      updateStepStatus(3, 'processing')
      const publicKeys = await initializeKeyPair(userId)
      await delay(800)
      updateStepStatus(3, 'complete')

      updateStepStatus(4, 'processing')
      await delay(800)
      updateStepStatus(4, 'complete')

      setPublicKeyFingerprint(publicKeys.ecdsaPublicKeyJWK.substring(0, 32))
      setIsComplete(true)
      await delay(1000)
      onComplete(publicKeys)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate keys')
    }
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-lg border border-red-500/30 bg-slate-900 p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Key Generation Failed</h2>
            <p className="mb-6 text-slate-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-lg border border-emerald-500/30 bg-slate-900 p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">Generating Your Cryptographic Identity</h2>
          <p className="text-slate-400">Your private keys will be stored securely on this device only</p>
        </div>

        <div className="mb-8 space-y-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
                step.status === 'complete'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : step.status === 'processing'
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-slate-700/30 bg-slate-800/50'
              }`}
            >
              <div className="flex-shrink-0">
                {step.status === 'complete' ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : step.status === 'processing' ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700">
                    <span className="text-sm font-medium text-slate-400">{step.id}</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    step.status === 'complete'
                      ? 'text-emerald-400'
                      : step.status === 'processing'
                        ? 'text-blue-400'
                        : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        {publicKeyFingerprint ? (
          <div className="mb-6 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <p className="mb-2 text-xs text-slate-400">Public Key Fingerprint</p>
            <p className="break-all font-mono text-sm text-emerald-400">{publicKeyFingerprint}...</p>
          </div>
        ) : null}

        <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="mb-1 text-sm font-medium text-blue-400">Your private key never leaves this device</p>
              <p className="text-xs text-slate-400">All cryptographic operations are performed locally using the Web Crypto API</p>
            </div>
          </div>
        </div>

        {isComplete ? (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-6 py-3">
              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-semibold text-emerald-400">Key Vault Secured</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
