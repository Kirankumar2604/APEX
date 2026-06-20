'use client'

import { useEffect, useState } from 'react'

interface RiskGaugeProps {
  score: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: { width: 120, radius: 50, stroke: 10, labelSize: 'text-xs' },
  md: { width: 180, radius: 70, stroke: 12, labelSize: 'text-sm' },
  lg: { width: 240, radius: 90, stroke: 14, labelSize: 'text-base' }
}

function getColor(score: number) {
  if (score <= 30) return '#22c55e'
  if (score <= 60) return '#f97316'
  return '#ef4444'
}

function getRiskLabel(score: number) {
  if (score <= 30) return 'SAFE'
  if (score <= 60) return 'LOW RISK'
  if (score <= 80) return 'MEDIUM RISK'
  return 'HIGH RISK'
}

export function RiskGauge({ score, label, size = 'md', className = '' }: RiskGaugeProps) {
  const [animated, setAnimated] = useState(false)
  const config = sizeConfig[size]
  const circumference = Math.PI * config.radius
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100)
  const arcColor = getColor(score)
  const riskLabel = label || getRiskLabel(score)

  useEffect(() => {
    const timeout = window.setTimeout(() => setAnimated(true), 20)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <svg width={config.width} height={config.radius + config.stroke * 2} viewBox={`0 0 ${config.width} ${config.radius + config.stroke * 2}`}>
        <path
          d={`M ${config.stroke} ${config.radius + config.stroke} A ${config.radius} ${config.radius} 0 0 1 ${config.width - config.stroke} ${config.radius + config.stroke}`}
          fill="none"
          stroke="#334155"
          strokeWidth={config.stroke}
          strokeLinecap="round"
        />
        <path
          d={`M ${config.stroke} ${config.radius + config.stroke} A ${config.radius} ${config.radius} 0 0 1 ${config.width - config.stroke} ${config.radius + config.stroke}`}
          fill="none"
          stroke={arcColor}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        {[0, 30, 60, 100].map((tick) => {
          const angle = Math.PI * (tick / 100)
          const x = config.width / 2 + config.radius * Math.cos(Math.PI - angle)
          const y = config.radius + config.stroke + config.radius * Math.sin(Math.PI - angle)
          return <circle key={tick} cx={x} cy={y} r="3" fill="#64748b" />
        })}
      </svg>
      <div className="text-center">
        <div className="text-3xl font-bold text-white">{score}</div>
        <div className="text-sm text-slate-400">/ 100</div>
      </div>
      <div className={`font-semibold uppercase ${arcColor === '#22c55e' ? 'text-emerald-400' : arcColor === '#f97316' ? 'text-orange-400' : 'text-red-400'} ${config.labelSize}`}>
        {riskLabel}
      </div>
    </div>
  )
}

export default RiskGauge
