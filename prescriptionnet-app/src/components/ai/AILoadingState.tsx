'use client'

import { Brain, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AILoadingStateProps {
  type: 'safety' | 'fraud'
}

export function AILoadingState({ type }: AILoadingStateProps) {
  const [visibleSteps, setVisibleSteps] = useState(0)

  useEffect(() => {
    const steps = type === 'safety' ? 4 : 5
    const interval = setInterval(() => {
      setVisibleSteps((prev) => (prev < steps ? prev + 1 : prev))
    }, 600)

    return () => clearInterval(interval)
  }, [type])

  const steps =
    type === 'safety'
      ? [
          'Analyzing drug interactions...',
          'Checking for duplicate medications...',
          'Verifying allergy conflicts...',
          'Assessing medication safety risks...',
        ]
      : [
          'Running rule-based fraud detection...',
          'Checking for doctor shopping patterns...',
          'Detecting duplicate fill anomalies...',
          'Analyzing controlled substance usage...',
          'Running AI fraud classification...',
        ]

  const Icon = type === 'safety' ? Brain : Shield

  return (
    <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg border border-cyan-500/20">
      <div className="flex items-center gap-3 mb-6">
        <Icon className="w-5 h-5 text-cyan-400 animate-pulse" />
        <h3 className="text-lg font-bold text-cyan-100">
          {type === 'safety' ? 'Clinical Safety Analysis' : 'Fraud Detection Analysis'} in Progress
        </h3>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 transition-all duration-300 ${
              index < visibleSteps ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-700">
              {index < visibleSteps - 1 ? (
                <span className="text-green-400 text-xs">✓</span>
              ) : index === visibleSteps - 1 ? (
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              ) : (
                <span className="text-slate-400 text-xs">•</span>
              )}
            </div>
            <span className={index < visibleSteps ? 'text-slate-100' : 'text-slate-400'}>
              {step}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 w-full bg-slate-700 rounded-full h-1 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-500"
          style={{
            width: `${(visibleSteps / steps.length) * 100}%`,
          }}
        />
      </div>

      <p className="text-xs text-slate-400 mt-3 text-center">
        Processing with Claude AI • {Math.round((visibleSteps / steps.length) * 100)}%
      </p>
    </div>
  )
}
