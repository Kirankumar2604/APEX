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
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/30 border border-blue-500/50 rounded">
      <Unlock className="w-4 h-4 text-blue-400" />
      <span className="text-sm font-medium text-blue-100">Decrypted for Authorized Session</span>
    </div>
  )
}
