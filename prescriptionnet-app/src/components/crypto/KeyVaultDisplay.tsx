<<<<<<< HEAD
/**
 * Key Vault Display Component
 * Shows patient their key vault info (not the actual keys - just proof)
 */

'use client'

import { useState, useEffect } from 'react'
import { useCrypto } from '@/hooks/useCrypto'
import { getStoredKeyPair, getKeyPairCreatedAt, StoredKeyPair } from '@/lib/keystore'
=======
'use client'

import { Key, AlertCircle } from 'lucide-react'
import { getKeyFingerprint } from '@/lib/keystore'
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9

interface KeyVaultDisplayProps {
  userId: string
}

<<<<<<< HEAD
export default function KeyVaultDisplay({ userId }: KeyVaultDisplayProps) {
  const { rotateKeyPair } = useCrypto()
  const [keyPair, setKeyPair] = useState<StoredKeyPair | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [showRotateModal, setShowRotateModal] = useState(false)
  const [isRotating, setIsRotating] = useState(false)

  useEffect(() => {
    loadKeyPair()
  }, [userId])

  const loadKeyPair = () => {
    const stored = getStoredKeyPair(userId)
    const created = getKeyPairCreatedAt(userId)
    setKeyPair(stored)
    setCreatedAt(created)
  }

  const handleRotateKeys = async () => {
    setIsRotating(true)
    try {
      await rotateKeyPair(userId)
      loadKeyPair()
      setShowRotateModal(false)
    } catch (error) {
      console.error('Failed to rotate keys:', error)
    } finally {
      setIsRotating(false)
    }
  }

  if (!keyPair) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <p className="text-slate-400 text-center">No keypair found</p>
=======
export function KeyVaultDisplay({ userId }: KeyVaultDisplayProps) {
  const fingerprint = getKeyFingerprint(userId)

  if (!fingerprint) {
    return (
      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-400">No keypair initialized</p>
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
      </div>
    )
  }

<<<<<<< HEAD
  const ecdsaFingerprint = keyPair.ecdsaPublicKey.substring(0, 40)
  const ecdhFingerprint = keyPair.ecdhPublicKey.substring(0, 40)

  return (
    <>
      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Key Vault</h2>
              <p className="text-sm text-slate-400">Cryptographic identity and security keys</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ECDSA Keypair Section */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">Digital Signature Key</h3>
                <p className="text-xs text-slate-400 mb-3">ECDSA P-256 keypair for signing consent authorizations</p>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Public Key Fingerprint</p>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-xs font-mono text-emerald-400 break-all">
                        {ecdsaFingerprint}...
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-slate-400">Private key secured on device</span>
                    <span className="text-blue-400 font-medium">• Never shown</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ECDH Keypair Section */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">Secure Exchange Key</h3>
                <p className="text-xs text-slate-400 mb-3">ECDH P-256 keypair for encrypted data sessions</p>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Public Key Fingerprint</p>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-xs font-mono text-purple-400 break-all">
                        {ecdhFingerprint}...
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-slate-400">Private key secured on device</span>
                    <span className="text-blue-400 font-medium">• Never shown</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Security Information
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Keys generated using Web Crypto API (FIPS 140-2 compliant)</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Private keys stored in encrypted localStorage</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Keys never transmitted to any server</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>All cryptographic operations performed locally in browser</span>
              </li>
            </ul>
          </div>

          {/* Metadata */}
          {createdAt && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700">
              <span>Created: {new Date(createdAt).toLocaleString()}</span>
              <span className="font-mono">User ID: {userId.substring(0, 8)}...</span>
            </div>
          )}

          {/* Regenerate Keys Button */}
          <button
            onClick={() => setShowRotateModal(true)}
            className="w-full px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Regenerate Keys
          </button>
        </div>
      </div>

      {/* Rotate Keys Modal */}
      {showRotateModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-lg max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Regenerate Keys?</h3>
              <p className="text-sm text-slate-400 mb-4">
                This will generate new cryptographic keys and invalidate all existing signatures and sessions.
              </p>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-left">
                <p className="text-xs text-red-400 font-medium mb-1">⚠️ Warning:</p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• All active consent authorizations will be revoked</li>
                  <li>• All encrypted sessions will be terminated</li>
                  <li>• You will need to re-authorize all data access requests</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRotateModal(false)}
                disabled={isRotating}
                className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRotateKeys}
                disabled={isRotating}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRotating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Rotating...</span>
                  </>
                ) : (
                  'Regenerate Keys'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Made with Bob
=======
  return (
    <div className="space-y-3">
      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-cyan-100 mb-3">
          <Key className="w-4 h-4" />
          ECDSA Signing Key
        </h4>
        <div className="text-xs font-mono text-cyan-400 break-all p-2 bg-slate-900 rounded">
          {fingerprint}
        </div>
        <p className="text-xs text-slate-400 mt-2">P-256 Curve | SHA-256 Hashing</p>
      </div>

      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-100 mb-3">
          <Key className="w-4 h-4" />
          ECDH Encryption Key
        </h4>
        <div className="text-xs font-mono text-blue-400 break-all p-2 bg-slate-900 rounded">
          {fingerprint}
        </div>
        <p className="text-xs text-slate-400 mt-2">P-256 Curve | Key Exchange</p>
      </div>

      <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded flex gap-2">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-100">
          Keys never leave this device. All cryptographic operations are browser-based and cannot be intercepted.
        </p>
      </div>
    </div>
  )
}
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
