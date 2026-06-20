'use client'

import { useEffect, useState } from 'react'
import { useCrypto } from '@/hooks/useCrypto'

interface KeypairSetupProps {
  userId: string
  onComplete: () => void
}

export default function KeypairSetup({ userId, onComplete }: KeypairSetupProps) {
  const { initializeKeyPair, isLoading, error } = useCrypto()
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState(false)

  const steps = [
    'Generating ECDSA P-256 keypair for digital signatures...',
    'Generating ECDH P-256 keypair for secure key exchange...',
    'Encrypting private keys for local storage...',
    'Registering public keys with the network...',
  ]

  useEffect(() => {
    const run = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i)
        await new Promise(r => setTimeout(r, 700))
        if (i === 0) await initializeKeyPair(userId)
      }
      setCompleted(true)
    }
    run()
  }, [userId])

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="text-xl font-bold text-white">
            Generating Your Cryptographic Identity
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Your private keys will be stored securely on this device only
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 flex-shrink-0">
                {i < currentStep || completed ? (
                  <span className="text-green-400">✓</span>
                ) : i === currentStep ? (
                  <span className="text-blue-400 animate-pulse">⟳</span>
                ) : (
                  <span className="text-slate-600">○</span>
                )}
              </div>
              <span className={`text-sm ${i < currentStep || completed
                ? 'text-green-400'
                : i === currentStep
                  ? 'text-white'
                  : 'text-slate-600'
                }`}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-700 rounded-full h-1.5 mb-6">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${completed ? 100 : (currentStep / steps.length) * 100}%` }}
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm text-center mb-4">{error}</div>
        )}

        {completed && (
          <div className="text-center">
            <div className="text-green-400 text-lg font-semibold mb-1">
              🛡️ Key Vault Secured
            </div>
            <p className="text-slate-400 text-xs mb-4">
              Your private key never leaves this device
            </p>
            <button
              onClick={onComplete}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              Enter PrescriptionNet →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}