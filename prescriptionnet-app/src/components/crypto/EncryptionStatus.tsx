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
      <div className="flex items-center gap-2 rounded border border-green-500/50 bg-green-900/30 px-3 py-2">
        <Shield className="h-4 w-4 text-green-400" />
        <span className="text-sm font-medium text-green-100">{algorithm} Encrypted</span>
        <div className="ml-2 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        {keyFingerprint ? <span className="font-mono text-xs text-green-300">{keyFingerprint}</span> : null}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded border border-blue-500/50 bg-blue-900/30 px-3 py-2">
      <Unlock className="h-4 w-4 text-blue-400" />
      <span className="text-sm font-medium text-blue-100">Decrypted for Authorized Session</span>
    </div>
  )
}

export default EncryptionStatus
