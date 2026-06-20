<<<<<<< HEAD
/**
 * Encryption Status Component
 * Always-visible status bar showing encryption state
 */

'use client'

interface EncryptionStatusProps {
  isEncrypted: boolean
  algorithm?: string
  keyId?: string
}

export default function EncryptionStatus({
  isEncrypted,
  algorithm = 'AES-256-GCM',
  keyId,
}: EncryptionStatusProps) {
  if (isEncrypted) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2 flex items-center gap-3">
        {/* Lock Icon with Glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md animate-pulse" />
          <div className="relative w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Status Text */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-emerald-400">
              {algorithm} Encrypted
            </span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          {keyId && (
            <p className="text-xs text-slate-400 font-mono">
              Key: {keyId.substring(0, 16)}...
            </p>
          )}
        </div>

        {/* Algorithm Badge */}
        <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
          <span className="text-xs font-medium text-emerald-300">
            {algorithm}
          </span>
        </div>
=======
'use client'

import { Shield, Unlock } from 'lucide-react'

interface EncryptionStatusProps {
  isEncrypted: boolean
  algorithm?: string
  keyFingerprint?: string
}

export function EncryptionStatus({
  isEncrypted,
  algorithm = 'AES-256-GCM',
  keyFingerprint,
}: EncryptionStatusProps) {
  if (isEncrypted) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 border border-green-500/50 rounded">
        <div className="flex items-center gap-2 flex-1">
          <Shield className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-green-100">{algorithm} Encrypted</span>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-2" />
        </div>
        {keyFingerprint && (
          <span className="text-xs text-green-300 font-mono">{keyFingerprint}</span>
        )}
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
      </div>
    )
  }

  return (
<<<<<<< HEAD
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 flex items-center gap-3 animate-pulse">
      {/* Unlock Icon */}
      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      </div>

      {/* Warning Text */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-red-400">
            UNENCRYPTED WARNING
          </span>
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-xs text-slate-400">
          Data is not encrypted
        </p>
      </div>

      {/* Status Badge */}
      <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
        <span className="text-xs font-medium text-red-300">
          INSECURE
        </span>
      </div>
    </div>
  )
}

// Made with Bob
=======
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/30 border border-blue-500/50 rounded">
      <Unlock className="w-4 h-4 text-blue-400" />
      <span className="text-sm font-medium text-blue-100">Decrypted for Authorized Session</span>
    </div>
  )
}
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
