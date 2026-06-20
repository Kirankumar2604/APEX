'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface SessionStatusProps {
  consentId: string
  patientName: string
  requesterName: string
  expiresAt: string
  onExpired: () => void
}

export function SessionStatus({
  consentId,
  patientName,
  requesterName,
  expiresAt,
  onExpired,
}: SessionStatusProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const expiryDate = new Date(expiresAt)
      const diff = expiryDate.getTime() - now.getTime()

      if (diff <= 0) {
        setIsExpired(true)
        setTimeLeft('Expired')
        onExpired()
      } else {
        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)

        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`)
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`)
        } else {
          setTimeLeft(`${seconds}s`)
        }
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, onExpired])

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        isExpired
          ? 'bg-red-900/20 border-red-500/50'
          : 'bg-cyan-900/20 border-cyan-500/50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3
            className={`font-semibold ${
              isExpired ? 'text-red-100' : 'text-cyan-100'
            }`}
          >
            {isExpired ? 'Session Expired' : 'Secure Channel Active'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {patientName} → {requesterName}
          </p>
        </div>
        {!isExpired && (
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        )}
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-300">
          <span>Session ID:</span>
          <span className="font-mono text-cyan-400 truncate">
            {consentId.substring(0, 16)}...
          </span>
        </div>

        <div className="flex justify-between items-center text-slate-300">
          <span>Algorithm:</span>
          <span className="text-cyan-300">ECDH + AES-256-GCM</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Time Remaining:
          </span>
          <span className={isExpired ? 'text-red-300' : 'text-cyan-300'}>
            {timeLeft}
          </span>
        </div>
      </div>
    </div>
  )
}
