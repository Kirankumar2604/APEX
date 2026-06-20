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
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setIsExpired(true)
        setTimeLeft('Expired')
        onExpired()
        return
      }

      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`)
    }

    update()
    const interval = window.setInterval(update, 1000)
    return () => window.clearInterval(interval)
  }, [expiresAt, onExpired])

  return (
    <div className={`rounded-lg border p-4 ${isExpired ? 'border-red-500/50 bg-red-900/20' : 'border-cyan-500/50 bg-cyan-900/20'}`}>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className={`font-semibold ${isExpired ? 'text-red-100' : 'text-cyan-100'}`}>
            {isExpired ? 'Session Expired' : 'Secure Channel Active'}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {patientName} → {requesterName}
          </p>
        </div>
        {!isExpired ? <Clock className="h-4 w-4 text-cyan-400" /> : null}
      </div>

      <div className="space-y-2 text-xs">
        <p className="text-slate-400">
          Consent: <span className="font-mono text-slate-200">{consentId}</span>
        </p>
        <p className="text-slate-400">
          Time Remaining: <span className={isExpired ? 'text-red-300' : 'text-cyan-300'}>{timeLeft}</span>
        </p>
      </div>
    </div>
  )
}

export default SessionStatus
