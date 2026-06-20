'use client'

import React from 'react'

/* ============================================
   FILE 6: Badge Component
   Variants: success, warning, danger, info, neutral
   Sizes: sm, md
   Optional dot indicator
   ============================================ */

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  dot?: boolean
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const variantConfig: Record<string, { bg: string; text: string; border: string; dotColor: string }> = {
  success: {
    bg: 'rgba(34, 197, 94, 0.1)',
    text: '#22c55e',
    border: 'rgba(34, 197, 94, 0.2)',
    dotColor: '#22c55e'
  },
  warning: {
    bg: 'rgba(249, 115, 22, 0.1)',
    text: '#f97316',
    border: 'rgba(249, 115, 22, 0.2)',
    dotColor: '#f97316'
  },
  danger: {
    bg: 'rgba(239, 68, 68, 0.1)',
    text: '#ef4444',
    border: 'rgba(239, 68, 68, 0.2)',
    dotColor: '#ef4444'
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.1)',
    text: '#3b82f6',
    border: 'rgba(59, 130, 246, 0.2)',
    dotColor: '#3b82f6'
  },
  neutral: {
    bg: 'rgba(148, 163, 184, 0.1)',
    text: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.15)',
    dotColor: '#94a3b8'
  }
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: {
    padding: '2px 8px',
    fontSize: '11px',
    borderRadius: '6px'
  },
  md: {
    padding: '4px 12px',
    fontSize: '12px',
    borderRadius: '8px'
  }
}

export default function Badge({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  children,
  className = '',
  style
}: BadgeProps) {
  const config = variantConfig[variant]

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap' as const,
    background: config.bg,
    color: config.text,
    border: `1px solid ${config.border}`,
    ...sizeStyles[size],
    ...style
  }

  return (
    <span className={className} style={badgeStyle}>
      {dot && (
        <span
          style={{
            width: size === 'sm' ? '6px' : '7px',
            height: size === 'sm' ? '6px' : '7px',
            borderRadius: '50%',
            backgroundColor: config.dotColor,
            flexShrink: 0,
            animation: 'pulse-dot 2s ease-in-out infinite'
          }}
        />
      )}
      {children}
    </span>
  )
}

/* ---- Helper: map risk level to badge variant ---- */
export function riskToBadgeVariant(risk: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (risk) {
    case 'HIGH': return 'danger'
    case 'MEDIUM': return 'warning'
    case 'LOW': return 'info'
    case 'SAFE': return 'success'
    default: return 'neutral'
  }
}

/* ---- Helper: map consent status to badge variant ---- */
export function statusToBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'active': return 'success'
    case 'pending': return 'warning'
    case 'expired': return 'neutral'
    case 'revoked': return 'danger'
    default: return 'neutral'
  }
}
