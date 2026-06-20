'use client'

import { Key, AlertCircle } from 'lucide-react'
import { getKeyFingerprint, getKeyPairCreatedAt } from '@/lib/keystore'

interface KeyVaultDisplayProps {
  userId: string
}

export function KeyVaultDisplay({ userId }: KeyVaultDisplayProps) {
  const fingerprint = getKeyFingerprint(userId)
  const createdAt = getKeyPairCreatedAt(userId)

  if (!fingerprint) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <div className="flex items-center gap-2 text-slate-400">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">No keypair initialized</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
      <div className="border-b border-slate-700 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
            <Key className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Your Key Vault</h2>
            <p className="text-sm text-slate-400">Cryptographic identity and security keys</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
          <p className="mb-2 text-xs text-slate-400">Public Key Fingerprint</p>
          <p className="break-all font-mono text-sm text-emerald-400">{fingerprint.substring(0, 32)}...</p>
        </div>

        {createdAt ? (
          <p className="text-xs text-slate-400">
            Created: {new Date(createdAt).toLocaleString()}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default KeyVaultDisplay
