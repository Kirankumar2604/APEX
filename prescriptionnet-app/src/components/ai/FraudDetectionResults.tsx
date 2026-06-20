'use client'

import { useMemo } from 'react'
import type { FraudAnalysis } from '@/types'
import { RiskGauge } from '@/components/ai/RiskGauge'
import { ExplainabilityCard } from '@/components/ai/ExplainabilityCard'
import { EthicsNotice } from '@/components/ai/EthicsNotice'

interface FraudDetectionResultsProps {
  analysis: FraudAnalysis
  patientName: string
  onRerun: () => void
  className?: string
}

export function FraudDetectionResults({ analysis, patientName, onRerun, className = '' }: FraudDetectionResultsProps) {
  const timestamp = useMemo(() => new Date().toLocaleString(), [])
  const ruleFlags = analysis.flags.filter((flag) => flag.detectedBy === 'rule')
  const aiFlags = analysis.flags.filter((flag) => flag.detectedBy === 'ai')
  const totalFlags = analysis.flags.length
  const highCount = analysis.flags.filter((flag) => flag.severity === 'HIGH').length
  const mediumCount = analysis.flags.filter((flag) => flag.severity === 'MEDIUM').length
  const lowCount = analysis.flags.filter((flag) => flag.severity === 'LOW').length

  return (
    <div className={`space-y-8 rounded-3xl bg-slate-950/95 p-6 text-slate-100 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-2xl font-semibold">Fraud & Pattern Analysis — {patientName}</div>
          <div className="mt-2 text-sm text-slate-400">{timestamp}</div>
        </div>
        <button type="button" onClick={onRerun} className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700">
          Re-run Analysis
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <RiskGauge score={analysis.fraudRiskScore} size="lg" />
          <p className="mt-5 text-base text-slate-300">{analysis.summary}</p>
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="space-y-3">
            <div className="text-sm text-slate-400">Rule-Based Flags</div>
            <div className="text-3xl font-bold text-white">{ruleFlags.length}</div>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-slate-400">AI-Detected Flags</div>
            <div className="text-3xl font-bold text-white">{aiFlags.length}</div>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-slate-400">Total Flags</div>
            <div className="text-3xl font-bold text-white">{totalFlags}</div>
          </div>
          <div className="space-y-2 rounded-2xl bg-slate-950/80 p-4">
            <div className="text-sm text-slate-300">Risk breakdown</div>
            <div className="flex items-center justify-between gap-3 text-sm text-slate-100">
              <span>HIGH</span>
              <span>{highCount}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-slate-100">
              <span>MEDIUM</span>
              <span>{mediumCount}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-slate-100">
              <span>LOW</span>
              <span>{lowCount}</span>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Suspicious Flags</div>
            <div className="text-sm text-slate-500">{totalFlags} total findings</div>
          </div>
        </div>
        {analysis.flags.length > 0 ? (
          <div className="grid gap-4">
            {analysis.flags.map((flag, index) => (
              <ExplainabilityCard
                key={`${flag.type}-${index}`}
                title={flag.type}
                explanation={flag.explanation}
                severity={flag.severity}
                detectedBy={flag.detectedBy}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-600/40 bg-emerald-950/60 p-5 text-emerald-200">No suspicious patterns detected.</div>
        )}
      </section>

      <div className="space-y-3">
        <EthicsNotice variant="footer" />
        <div className="text-sm text-slate-500">Pattern analysis for authorized review only. Not a legal determination of fraud.</div>
      </div>
    </div>
  )
}

export default FraudDetectionResults
