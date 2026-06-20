'use client'

import { useMemo } from 'react'
import type { SafetyAnalysis, RiskLevel } from '@/types'
import { ExplainabilityCard } from '@/components/ai/ExplainabilityCard'
import { EthicsNotice } from '@/components/ai/EthicsNotice'

interface SafetyAgentResultsProps {
  analysis: SafetyAnalysis
  patientName: string
  onRerun: () => void
  className?: string
}

const riskColors: Record<RiskLevel, string> = {
  HIGH: 'bg-red-600 text-white',
  MEDIUM: 'bg-orange-500 text-white',
  LOW: 'bg-amber-400 text-slate-900',
  SAFE: 'bg-emerald-500 text-white'
}

function formatCountBadge(count: number) {
  return count > 0 ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
}

export function SafetyAgentResults({ analysis, patientName, onRerun, className = '' }: SafetyAgentResultsProps) {
  const timestamp = useMemo(() => new Date().toLocaleString(), [])

  return (
    <div className={`space-y-8 rounded-3xl bg-slate-950/95 p-6 text-slate-100 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-2xl font-semibold">Clinical Safety Analysis — {patientName}</div>
          <div className="mt-2 text-sm text-slate-400">{timestamp}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-4 py-2 text-sm font-semibold ${riskColors[analysis.overallRiskLevel]}`}>{analysis.overallRiskLevel}</span>
          <button type="button" onClick={onRerun} className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700">
            Re-run Analysis
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className={`rounded-2xl p-4 ${formatCountBadge(analysis.drugInteractions.length)}`}>
          <div className="text-sm text-slate-200">Drug Interactions</div>
          <div className="mt-2 text-2xl font-bold">{analysis.drugInteractions.length}</div>
        </div>
        <div className={`rounded-2xl p-4 ${formatCountBadge(analysis.duplicateMedications.length)}`}>
          <div className="text-sm text-slate-200">Duplicate Medications</div>
          <div className="mt-2 text-2xl font-bold">{analysis.duplicateMedications.length}</div>
        </div>
        <div className={`rounded-2xl p-4 ${formatCountBadge(analysis.allergyConflicts.length)}`}>
          <div className="text-sm text-slate-200">Allergy Conflicts</div>
          <div className="mt-2 text-2xl font-bold">{analysis.allergyConflicts.length}</div>
        </div>
        <div className={`rounded-2xl p-4 ${formatCountBadge(analysis.medicationSafetyRisks.length)}`}>
          <div className="text-sm text-slate-200">Safety Risks</div>
          <div className="mt-2 text-2xl font-bold">{analysis.medicationSafetyRisks.length}</div>
        </div>
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Drug Interactions</div>
            <div className="text-sm text-slate-500">{analysis.drugInteractions.length} findings</div>
          </div>
        </div>
        {analysis.drugInteractions.length > 0 ? (
          <div className="grid gap-4">
            {analysis.drugInteractions.map((interaction, index) => (
              <ExplainabilityCard
                key={`${interaction.drugs.join('-')}-${index}`}
                title={`${interaction.drugs.join(' + ')} interaction`}
                explanation={interaction.explanation}
                severity={interaction.severity}
                detectedBy="ai"
                drugs={interaction.drugs}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-600/40 bg-emerald-950/60 p-5 text-emerald-200">No drug interactions detected.</div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Duplicate Medications</div>
            <div className="text-sm text-slate-500">{analysis.duplicateMedications.length} findings</div>
          </div>
        </div>
        {analysis.duplicateMedications.length > 0 ? (
          <div className="grid gap-4">
            {analysis.duplicateMedications.map((duplicate, index) => (
              <ExplainabilityCard
                key={`${duplicate.drug}-${index}`}
                title={`Duplicate medication: ${duplicate.drug}`}
                explanation={duplicate.explanation}
                severity="MEDIUM"
                detectedBy="ai"
                drugs={[duplicate.drug]}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-600/40 bg-emerald-950/60 p-5 text-emerald-200">No duplicate medications detected.</div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Allergy Conflicts</div>
            <div className="text-sm text-slate-500">{analysis.allergyConflicts.length} findings</div>
          </div>
        </div>
        {analysis.allergyConflicts.length > 0 ? (
          <div className="grid gap-4">
            {analysis.allergyConflicts.map((conflict, index) => (
              <ExplainabilityCard
                key={`${conflict.drug}-${conflict.allergy}-${index}`}
                title={`${conflict.drug} allergy conflict`}
                explanation={conflict.explanation}
                severity="HIGH"
                detectedBy="ai"
                drugs={[conflict.drug, conflict.allergy]}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-600/40 bg-emerald-950/60 p-5 text-emerald-200">No allergy conflicts detected.</div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Medication Safety Risks</div>
            <div className="text-sm text-slate-500">{analysis.medicationSafetyRisks.length} findings</div>
          </div>
        </div>
        {analysis.medicationSafetyRisks.length > 0 ? (
          <div className="grid gap-4">
            {analysis.medicationSafetyRisks.map((risk, index) => (
              <ExplainabilityCard
                key={`${risk.risk}-${index}`}
                title={risk.risk}
                explanation={risk.explanation}
                severity="MEDIUM"
                detectedBy="ai"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-600/40 bg-emerald-950/60 p-5 text-emerald-200">No medication safety risks detected.</div>
        )}
      </section>

      <div className="space-y-3">
        <EthicsNotice variant="footer" />
        <p className="text-sm text-slate-500">Analysis performed by AI — all findings require physician review</p>
      </div>
    </div>
  )
}

export default SafetyAgentResults
