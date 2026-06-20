'use client'

import React from 'react'
import type { RiskLevel } from '@/types'

/* ============================================
   FILE 9: StatCard Component
   Icon + label + value
   Optional trend indicator
   Color variants matching risk levels
   Subtle glow effect
   ============================================ */

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    text: string
  }
  color?: 'blue' | 'cyan' | 'green' | 'orange' | 'red' | 'neutral'
  riskLevel?: RiskLevel
  className?: string
  id?: string
}

const COLOR_CONFIG: Record<string, {
  accent: string
  bgGradient: string
  glowClass: string
  iconBg: string
  iconBorder: string
  trendUpColor: string
  trendDownColor: string
}> = {
  blue: {
    accent: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(59, 130, 246, 0.02))',
    glowClass: 'glow-blue',
    iconBg: 'rgba(59, 130, 246, 0.12)',
    iconBorder: 'rgba(59, 130, 246, 0.2)',
    trendUpColor: '#22c55e',
    trendDownColor: '#ef4444'
  },
  cyan: {
    accent: '#06b6d4',
    bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.06), rgba(6, 182, 212, 0.02))',
    glowClass: 'glow-cyan',
    iconBg: 'rgba(6, 182, 212, 0.12)',
    iconBorder: 'rgba(6, 182, 212, 0.2)',
    trendUpColor: '#22c55e',
    trendDownColor: '#ef4444'
  },
  green: {
    accent: '#22c55e',
    bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.06), rgba(34, 197, 94, 0.02))',
    glowClass: 'glow-green',
    iconBg: 'rgba(34, 197, 94, 0.12)',
    iconBorder: 'rgba(34, 197, 94, 0.2)',
    trendUpColor: '#22c55e',
    trendDownColor: '#ef4444'
  },
  orange: {
    accent: '#f97316',
    bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.06), rgba(249, 115, 22, 0.02))',
    glowClass: 'glow-orange',
    iconBg: 'rgba(249, 115, 22, 0.12)',
    iconBorder: 'rgba(249, 115, 22, 0.2)',
    trendUpColor: '#22c55e',
    trendDownColor: '#ef4444'
  },
  red: {
    accent: '#ef4444',
    bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.06), rgba(239, 68, 68, 0.02))',
    glowClass: 'glow-red',
    iconBg: 'rgba(239, 68, 68, 0.12)',
    iconBorder: 'rgba(239, 68, 68, 0.2)',
    trendUpColor: '#22c55e',
    trendDownColor: '#ef4444'
  },
  neutral: {
    accent: '#94a3b8',
    bgGradient: 'linear-gradient(135deg, rgba(148, 163, 184, 0.06), rgba(148, 163, 184, 0.02))',
    glowClass: '',
    iconBg: 'rgba(148, 163, 184, 0.12)',
    iconBorder: 'rgba(148, 163, 184, 0.2)',
    trendUpColor: '#22c55e',
    trendDownColor: '#ef4444'
  }
}

function riskToColor(risk: RiskLevel): string {
  switch (risk) {
    case 'HIGH': return 'red'
    case 'MEDIUM': return 'orange'
    case 'LOW': return 'blue'
    case 'SAFE': return 'green'
    default: return 'neutral'
  }
}

export default function StatCard({
  icon,
  label,
  value,
  trend,
  color = 'blue',
  riskLevel,
  className = '',
  id
}: StatCardProps) {
  const effectiveColor = riskLevel ? riskToColor(riskLevel) : color
  const config = COLOR_CONFIG[effectiveColor]

  const trendArrow = trend?.direction === 'up' ? '↑' : trend?.direction === 'down' ? '↓' : '→'
  const trendColor =
    trend?.direction === 'up'
      ? config.trendUpColor
      : trend?.direction === 'down'
      ? config.trendDownColor
      : '#94a3b8'

  return (
    <div
      id={id}
      className={`${config.glowClass} ${className}`}
      style={{
        background: config.bgGradient,
        border: `1px solid ${config.iconBorder}`,
        borderRadius: '16px',
        padding: '20px',
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle shimmer overlay */}
      <div
        className="animate-shimmer"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '16px',
          pointerEvents: 'none'
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top row: icon + trend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: config.iconBg,
              border: `1px solid ${config.iconBorder}`,
              color: config.accent
            }}
          >
            {icon}
          </div>

          {trend && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: trendColor,
                padding: '3px 8px',
                borderRadius: '8px',
                background: `${trendColor}12`
              }}
            >
              <span>{trendArrow}</span>
              <span>{trend.text}</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#f1f5f9',
            lineHeight: 1.1,
            marginBottom: '4px',
            letterSpacing: '-0.02em'
          }}
        >
          {value}
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#64748b',
            letterSpacing: '0.01em'
          }}
        >
          {label}
        </div>
      </div>
    </div>
  )
}
