'use client'

import { useState } from 'react'
import type { RiskLevel } from '@/types'

interface ExplainabilityCardProps {
  title: string
  explanation: string
  severity: RiskLevel
  detectedBy?: 'rule' | 'ai' | 'both'
  drugs?: string[]
  isExpanded?: boolean
  className?: string
}

const severityConfig = {
  HIGH: { border: 'border-red-500', badge: 'bg-red-600 text-white', glow: 'shadow-[0_0_12px_rgba(248,113,113,0.3)]' },
  MEDIUM: { border: 'border-orange-500', badge: 'bg-orange-500 text-white', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]' },
  LOW: { border: 'border-yellow-400', badge: 'bg-yellow-400 text-slate-900', glow: 'shadow-[0_0_12px_rgba(250,204,21,0.3)]' },
  SAFE: { border: 'border-emerald-500', badge: 'bg-emerald-500 text-white', glow: 'shadow-[0_0_12px_rgba(34,197,94,0.3)]' }
}

const detectedByConfig = {
  ai: { label: 'AI Detected', className: 'bg-cyan-600 text-white' },
  rule: { label: 'Rule Based', className: 'bg-sky-600 text-white' },
  both: { label: 'AI + Rule', className: 'bg-purple-600 text-white' }
}

export function ExplainabilityCard({
  title,
  explanation,
  severity,
  detectedBy = 'ai',
  drugs = [],
  isExpanded = false,
  className = ''
}: ExplainabilityCardProps) {
  const [open, setOpen] = useState(isExpanded)
  const config = severityConfig[severity]
  const detected = detectedByConfig[detectedBy]

  return (
    <div className={`rounded-2xl border ${config.border} bg-slate-900 p-5 transition ${className} hover:${config.glow}`}>
      <div className="flex items-start justify-between gap-4">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${detected.className}`}>{detected.label}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${config.badge}`}>{severity}</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-200 transition hover:bg-slate-700"
          aria-label={open ? 'Collapse explanation' : 'Expand explanation'}
        >
          <span className={`block transition-transform ${open ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
      </div>
      {drugs.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {drugs.map((drug) => (
            <span key={drug} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
              {drug}
            </span>
          ))}
        </div>
      ) : null}
      <div className={`mt-4 overflow-hidden transition-all duration-300 ${open ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-sm leading-6 text-slate-300">{explanation}</p>
      </div>
      <p className="mt-4 text-xs italic text-slate-500">For physician review only — not a medical diagnosis</p>
    </div>
  )
}

export default ExplainabilityCard
