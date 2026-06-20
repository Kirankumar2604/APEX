'use client'

import { Key, AlertCircle } from 'lucide-react'
import { getKeyFingerprint } from '@/lib/keystore'

interface KeyVaultDisplayProps {
  userId: string
}

export function KeyVaultDisplay({ userId }: KeyVaultDisplayProps) {
  const fingerprint = getKeyFingerprint(userId)

  if (!fingerprint) {
    return (
      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-400">No keypair initialized</p>
      </div>
    )
  }

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
