'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

/* ============================================
   FILE 10: CountdownTimer Component
   Takes expiresAt timestamp as prop
   Shows: Xh Xm Xs remaining
   Color changes: green → orange → red
   On expiry: shows "EXPIRED" in red
   Updates every second
   ============================================ */

interface CountdownTimerProps {
  expiresAt: string  // ISO 8601 timestamp
  className?: string
  compact?: boolean
  id?: string
}

interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
}

function calculateTimeLeft(expiresAt: string): TimeLeft {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 }
  }
  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { hours, minutes, seconds, totalSeconds }
}

function getTimerColor(totalSeconds: number): {
  text: string
  bg: string
  border: string
  glow: string
} {
  if (totalSeconds <= 0) {
    // Expired
    return {
      text: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.2)',
      glow: 'rgba(239, 68, 68, 0.1)'
    }
  }
  if (totalSeconds <= 300) {
    // < 5 minutes — RED (critical)
    return {
      text: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.25)',
      glow: 'rgba(239, 68, 68, 0.12)'
    }
  }
  if (totalSeconds <= 1800) {
    // < 30 minutes — ORANGE (warning)
    return {
      text: '#f97316',
      bg: 'rgba(249, 115, 22, 0.08)',
      border: 'rgba(249, 115, 22, 0.2)',
      glow: 'rgba(249, 115, 22, 0.1)'
    }
  }
  // > 30 minutes — GREEN (safe)
  return {
    text: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.2)',
    glow: 'rgba(34, 197, 94, 0.08)'
  }
}

export default function CountdownTimer({
  expiresAt,
  className = '',
  compact = false,
  id
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(expiresAt))

  const update = useCallback(() => {
    setTimeLeft(calculateTimeLeft(expiresAt))
  }, [expiresAt])

  useEffect(() => {
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [update])

  const isExpired = timeLeft.totalSeconds <= 0
  const colors = getTimerColor(timeLeft.totalSeconds)
  const pad = (n: number) => n.toString().padStart(2, '0')

  if (compact) {
    return (
      <span
        id={id}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          fontWeight: 600,
          color: colors.text,
          fontFamily: 'var(--font-geist-mono), monospace'
        }}
      >
        <Clock className="w-3 h-3" />
        {isExpired ? (
          'EXPIRED'
        ) : (
          `${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`
        )}
      </span>
    )
  }

  return (
    <div
      id={id}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: '14px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 0 20px ${colors.glow}`,
        transition: 'all 500ms ease'
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${colors.text}15`,
          color: colors.text,
          transition: 'all 500ms ease'
        }}
      >
        {isExpired ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
      </div>

      {/* Time display */}
      <div>
        {isExpired ? (
          <div
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: colors.text,
              letterSpacing: '0.05em'
            }}
          >
            EXPIRED
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '2px',
              fontFamily: 'var(--font-geist-mono), monospace'
            }}
          >
            <TimeUnit value={timeLeft.hours} label="h" color={colors.text} />
            <Separator color={colors.text} />
            <TimeUnit value={timeLeft.minutes} label="m" color={colors.text} />
            <Separator color={colors.text} />
            <TimeUnit value={timeLeft.seconds} label="s" color={colors.text} />
          </div>
        )}
        <div
          style={{
            fontSize: '11px',
            color: '#64748b',
            marginTop: '2px',
            fontWeight: 500
          }}
        >
          {isExpired ? 'Session ended' : 'remaining'}
        </div>
      </div>
    </div>
  )
}

/* ---- Sub-components ---- */

function TimeUnit({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
      <span
        style={{
          fontSize: '20px',
          fontWeight: 800,
          color: '#f1f5f9',
          lineHeight: 1,
          minWidth: '28px',
          textAlign: 'center'
        }}
      >
        {value.toString().padStart(2, '0')}
      </span>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color,
          opacity: 0.7
        }}
      >
        {label}
      </span>
    </span>
  )
}

function Separator({ color }: { color: string }) {
  return (
    <span
      style={{
        fontSize: '18px',
        fontWeight: 700,
        color,
        opacity: 0.4,
        margin: '0 1px',
        animation: 'pulse-dot 1s ease-in-out infinite'
      }}
    >
      :
    </span>
  )
}
