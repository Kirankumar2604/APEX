<<<<<<< HEAD
/**
 * Keypair Setup Component
 * UI shown to new users after login to generate their cryptographic keys
 */

'use client'

import { useState, useEffect } from 'react'
=======
'use client'

import { useEffect, useState } from 'react'
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
import { useCrypto } from '@/hooks/useCrypto'

interface KeypairSetupProps {
  userId: string
<<<<<<< HEAD
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
  const [publicKeyFingerprint, setPublicKeyFingerprint] = useState<string>('')
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    generateKeys()
  }, [])

  const generateKeys = async () => {
    try {
      // Step 1: Start ECDSA generation
      updateStepStatus(1, 'processing')
      await delay(800)
      updateStepStatus(1, 'complete')

      // Step 2: Start ECDH generation
      updateStepStatus(2, 'processing')
      await delay(800)
      updateStepStatus(2, 'complete')

      // Step 3: Encrypt and store
      updateStepStatus(3, 'processing')
      const publicKeys = await initializeKeyPair(userId)
      await delay(800)
      updateStepStatus(3, 'complete')

      // Step 4: Register public keys
      updateStepStatus(4, 'processing')
      await delay(800)
      updateStepStatus(4, 'complete')

      // Set fingerprint (first 32 chars of ECDSA public key)
      const fingerprint = publicKeys.ecdsaPublicKeyJWK.substring(0, 32)
      setPublicKeyFingerprint(fingerprint)

      // Mark as complete
      setIsComplete(true)

      // Wait a moment before calling onComplete
      await delay(1000)
      onComplete(publicKeys)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate keys'
      setError(errorMessage)
    }
  }

  const updateStepStatus = (stepId: number, status: 'pending' | 'processing' | 'complete') => {
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, status } : step
      )
    )
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-900 border border-red-500/30 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Key Generation Failed</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-lg p-8 max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Generating Your Cryptographic Identity
          </h2>
          <p className="text-slate-400">
            Your private keys will be stored securely on this device only
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                step.status === 'complete'
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : step.status === 'processing'
                  ? 'bg-blue-500/5 border-blue-500/30'
                  : 'bg-slate-800/50 border-slate-700/30'
              }`}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {step.status === 'complete' ? (
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : step.status === 'processing' ? (
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-slate-400 text-sm font-medium">{step.id}</span>
                  </div>
                )}
              </div>

              {/* Step Title */}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  step.status === 'complete'
                    ? 'text-emerald-400'
                    : step.status === 'processing'
                    ? 'text-blue-400'
                    : 'text-slate-400'
                }`}>
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Public Key Fingerprint */}
        {publicKeyFingerprint && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-6">
            <p className="text-xs text-slate-400 mb-2">Public Key Fingerprint</p>
            <p className="text-sm font-mono text-emerald-400 break-all">
              {publicKeyFingerprint}...
            </p>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-400 mb-1">
                Your private key never leaves this device
              </p>
              <p className="text-xs text-slate-400">
                All cryptographic operations are performed locally using the Web Crypto API
              </p>
            </div>
          </div>
        </div>

        {/* Success State */}
        {isComplete && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-emerald-400 font-semibold">Key Vault Secured</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Made with Bob
=======
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
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
