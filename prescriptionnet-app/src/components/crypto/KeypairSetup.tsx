'use client'

import { useEffect, useState } from 'react'
import { useCrypto } from '@/hooks/useCrypto'

interface KeypairSetupProps {
  userId: string
  onComplete: () => void
}

export function KeypairSetup({ userId, onComplete }: KeypairSetupProps) {
  const { initializeKeyPair, isLoading } = useCrypto()
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    const runSetup = async () => {
      try {
        setStep(0)
        await new Promise((resolve) => setTimeout(resolve, 700))

        setStep(1)
        await new Promise((resolve) => setTimeout(resolve, 700))

        setStep(2)
        await new Promise((resolve) => setTimeout(resolve, 700))

        setStep(3)
        await initializeKeyPair(userId)
        await new Promise((resolve) => setTimeout(resolve, 700))

        setCompleted(true)
        onComplete()
      } catch (error) {
        console.error('Setup failed:', error)
        setStep(0)
      }
    }

    runSetup()
  }, [userId, initializeKeyPair, onComplete])

  const steps = [
    'Generating ECDSA P-256 signing keypair...',
    'Generating ECDH P-256 encryption keypair...',
    'Securing your key vault...',
    'Initializing encrypted health vault...',
  ]

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg border border-cyan-500/20">
      <h2 className="text-xl font-bold text-cyan-400 mb-6">Key Generation Setup</h2>

      <div className="space-y-4 mb-6">
        {steps.map((stepText, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 transition-all duration-300 ${
              index <= step ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-700">
              {index < step ? (
                <span className="text-green-400 text-sm">✓</span>
              ) : index === step ? (
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
              ) : (
                <span className="text-slate-400 text-sm">{index + 1}</span>
              )}
            </div>
            <span className={index <= step ? 'text-slate-100' : 'text-slate-400'}>
              {stepText}
            </span>
          </div>
        ))}
      </div>

      <div className="w-full bg-slate-700 rounded-full h-2 mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-500"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      {completed && (
        <button
          onClick={onComplete}
          className="w-full px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-400 text-slate-900 font-semibold rounded hover:from-cyan-300 hover:to-blue-300 transition-all"
        >
          Enter PrescriptionNet →
        </button>
      )}
    </div>
  )
}
