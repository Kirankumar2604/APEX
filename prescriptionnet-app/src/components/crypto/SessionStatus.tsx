<<<<<<< HEAD
/**
 * Session Status Component
 * Shows active session info to the doctor/requester
 */

'use client'

import { useState, useEffect } from 'react'

interface SessionStatusProps {
  sessionId: string
  patientName: string
  scope: string
  expiresAt: string
  onSessionExpired: () => void
}

export default function SessionStatus({
  sessionId,
  patientName,
  scope,
  expiresAt,
  onSessionExpired,
}: SessionStatusProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)
  const [progress, setProgress] = useState(100)
=======
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
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
<<<<<<< HEAD
      const expiry = new Date(expiresAt)
      const diff = expiry.getTime() - now.getTime()

      if (diff <= 0) {
        setIsExpired(true)
        setTimeRemaining('Expired')
        setProgress(0)
        onSessionExpired()
        return
      }

      // Calculate time remaining
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`)
      } else {
        setTimeRemaining(`${seconds}s`)
      }

      // Calculate progress (assuming 1 hour session)
      const totalDuration = 60 * 60 * 1000 // 1 hour in ms
      const progressPercent = Math.max(0, Math.min(100, ((totalDuration - diff) / totalDuration) * 100))
      setProgress(100 - progressPercent)
=======
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
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
<<<<<<< HEAD
  }, [expiresAt, onSessionExpired])

  if (isExpired) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">Session Expired</p>
            <p className="text-xs text-slate-400">Access to patient data has been revoked</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          {/* Shield Icon with Pulse */}
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-md animate-pulse" />
            <div className="relative w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          {/* Session Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-emerald-400">
                Secure Channel Established
              </h3>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 mb-2">
              End-to-end encrypted session active
            </p>

            {/* Session Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Patient:</span>
                <p className="text-white font-medium">{patientName}</p>
              </div>
              <div>
                <span className="text-slate-500">Scope:</span>
                <p className="text-emerald-400 font-medium">{scope}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Session ID */}
        <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
          <p className="text-xs text-slate-400 mb-1">Session ID</p>
          <p className="text-xs font-mono text-slate-300">
            {sessionId.substring(0, 32)}...
          </p>
        </div>

        {/* Algorithm Info */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2">
            <div className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-medium text-emerald-300">
              AES-256-GCM
            </div>
            <span className="text-slate-500 text-xs">+</span>
            <div className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs font-medium text-blue-300">
              ECDH P-256
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Time Remaining</span>
            <span className={`text-sm font-mono font-bold ${
              progress < 20 ? 'text-red-400' : progress < 50 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {timeRemaining}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                progress < 20
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : progress < 50
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-emerald-500/5 border-t border-emerald-500/20 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Encrypted for your eyes only</span>
=======
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
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
        </div>
      </div>
    </div>
  )
}
<<<<<<< HEAD

// Made with Bob
=======
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
