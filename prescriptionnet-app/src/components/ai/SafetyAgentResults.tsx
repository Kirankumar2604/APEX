'use client'

import type { SafetyAnalysis } from '@/types'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface SafetyAgentResultsProps {
  analysis: SafetyAnalysis
  patientName: string
  onRerun: () => void
}

const riskColors: Record<string, { bg: string; text: string; icon: string }> = {
  HIGH: { bg: 'bg-red-900/30', text: 'text-red-100', icon: '⚠️' },
  MEDIUM: { bg: 'bg-amber-900/30', text: 'text-amber-100', icon: '⚡' },
  LOW: { bg: 'bg-blue-900/30', text: 'text-blue-100', icon: 'ℹ️' },
  SAFE: { bg: 'bg-green-900/30', text: 'text-green-100', icon: '✓' },
}

export function SafetyAgentResults({
  analysis,
  patientName,
  onRerun,
}: SafetyAgentResultsProps) {
  const riskStyle = riskColors[analysis.overallRiskLevel]

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg border ${riskStyle.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-bold text-lg ${riskStyle.text}`}>
            {riskStyle.icon} Overall Risk: {analysis.overallRiskLevel}
          </h3>
        </div>
        <p className="text-sm text-slate-300">{patientName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-800 rounded text-center">
          <div className="text-2xl font-bold text-cyan-400">
            {analysis.drugInteractions.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Drug Interactions</div>
        </div>

        <div className="p-3 bg-slate-800 rounded text-center">
          <div className="text-2xl font-bold text-orange-400">
            {analysis.duplicateMedications.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Duplicates</div>
        </div>

        <div className="p-3 bg-slate-800 rounded text-center">
          <div className="text-2xl font-bold text-red-400">
            {analysis.allergyConflicts.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Allergy Conflicts</div>
        </div>

        <div className="p-3 bg-slate-800 rounded text-center">
          <div className="text-2xl font-bold text-purple-400">
            {analysis.medicationSafetyRisks.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Safety Risks</div>
        </div>
      </div>

      {analysis.drugInteractions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-cyan-100">Drug Interactions</h4>
          {analysis.drugInteractions.map((interaction, i) => (
            <div key={i} className="p-3 bg-slate-800 rounded border-l-2 border-cyan-500">
              <p className="text-sm font-mono text-cyan-300">
                {interaction.drugs.join(' + ')}
              </p>
              <p className="text-xs text-slate-400 mt-1">{interaction.explanation}</p>
              <span className={`text-xs font-semibold mt-1 inline-block px-2 py-1 rounded ${riskColors[interaction.severity]?.text || 'text-slate-300'}`}>
                {interaction.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      {analysis.duplicateMedications.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-orange-100">Duplicate Medications</h4>
          {analysis.duplicateMedications.map((dup, i) => (
            <div key={i} className="p-3 bg-slate-800 rounded border-l-2 border-orange-500">
              <p className="text-sm font-mono text-orange-300">{dup.drug}</p>
              <p className="text-xs text-slate-400 mt-1">{dup.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {analysis.allergyConflicts.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-red-100">Allergy Conflicts</h4>
          {analysis.allergyConflicts.map((conflict, i) => (
            <div key={i} className="p-3 bg-slate-800 rounded border-l-2 border-red-500">
              <p className="text-sm font-mono text-red-300">
                {conflict.drug} × {conflict.allergy}
              </p>
              <p className="text-xs text-slate-400 mt-1">{conflict.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {analysis.medicationSafetyRisks.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-purple-100">Safety Risks</h4>
          {analysis.medicationSafetyRisks.map((risk, i) => (
            <div key={i} className="p-3 bg-slate-800 rounded border-l-2 border-purple-500">
              <p className="text-sm font-mono text-purple-300">{risk.risk}</p>
              <p className="text-xs text-slate-400 mt-1">{risk.explanation}</p>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 bg-slate-800 rounded border border-slate-700 text-xs text-slate-400">
        <p className="font-semibold text-slate-300 mb-1">⚕️ Physician Review Required</p>
        <p>{analysis.disclaimer}</p>
      </div>

      <button
        onClick={onRerun}
        className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded transition-colors"
      >
        Re-run Analysis
      </button>
    </div>
  )
}
