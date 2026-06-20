'use client'

import { useEffect, useState } from 'react'

interface AILoadingStateProps {
  type: 'safety' | 'fraud'
  stage?: string
  className?: string
}

const SAFETY_STEPS = [
  'Reviewing prescription history...',
  'Checking drug interaction database...',
  'Analyzing allergy conflicts...',
  'Evaluating dosage safety...',
  'Generating safety report...'
]

const FRAUD_STEPS = [
  'Running rule-based detection...',
  'Checking prescription patterns...',
  'AI pattern analysis in progress...'
]

export function AILoadingState({ type, stage, className = '' }: AILoadingStateProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const steps = type === 'safety' ? SAFETY_STEPS : FRAUD_STEPS
  const icon = type === 'safety' ? '🧠' : '🛡️'
  const accent = type === 'safety' ? 'text-sky-300' : 'text-orange-300'

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, steps.length - 1))
    }, 500)
    return () => window.clearInterval(interval)
  }, [steps.length])

  return (
    <div className={`rounded-3xl border border-slate-700 bg-slate-950/95 p-6 text-slate-100 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 ${accent} text-2xl`}>{icon}</div>
        <div>
          <div className="text-lg font-semibold">
            {type === 'safety' ? 'Clinical Safety Agent Analyzing...' : 'Fraud Detection Engine Running...'}
          </div>
          <div className="text-sm text-slate-400">{stage ?? 'This may take a few moments.'}</div>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {steps.map((step, index) => {
          const isComplete = index < stepIndex
          const isCurrent = index === stepIndex
          return (
            <div key={step} className="flex items-center gap-3">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${isComplete ? 'bg-emerald-500' : isCurrent ? 'bg-sky-500' : 'bg-slate-700'} text-xs font-semibold`}>
                {isComplete ? '✓' : isCurrent ? '⟳' : index + 1}
              </span>
              <span className={`text-sm ${isComplete ? 'text-slate-200' : 'text-slate-400'}`}>{step}</span>
            </div>
          )
        })}
      </div>
      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-500">Powered by Anthropic Claude</p>
    </div>
  )
}

export default AILoadingState
