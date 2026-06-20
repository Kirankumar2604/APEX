'use client'

import type { FraudAnalysis } from '@/types'
import { AlertTriangle, Shield } from 'lucide-react'

interface FraudDetectionResultsProps {
  analysis: FraudAnalysis
  patientName: string
  onRerun: () => void
}

const severityColors: Record<string, string> = {
  HIGH: 'text-red-400 bg-red-900/30',
  MEDIUM: 'text-amber-400 bg-amber-900/30',
  LOW: 'text-blue-400 bg-blue-900/30',
}

export function FraudDetectionResults({
  analysis,
  patientName,
  onRerun,
}: FraudDetectionResultsProps) {
  const isHighRisk = analysis.fraudRiskScore > 70
  const isMediumRisk = analysis.fraudRiskScore > 40

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg text-center ${isHighRisk ? 'bg-red-900/30 border border-red-500/50' : 'bg-green-900/30 border border-green-500/50'}`}>
          <div className={`text-3xl font-bold ${isHighRisk ? 'text-red-300' : 'text-green-300'}`}>
            {analysis.fraudRiskScore}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Fraud Risk Score</div>
          <div className="text-xs text-slate-300 mt-2">
            {isHighRisk && 'HIGH RISK'}
            {isMediumRisk && !isHighRisk && 'MEDIUM RISK'}
            {!isMediumRisk && !isHighRisk && 'LOW RISK'}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
          <div className="text-2xl font-bold text-cyan-400">{analysis.flags.length}</div>
          <div className="text-xs text-slate-400 mt-1">Suspicious Flags</div>
          <div className="text-xs text-slate-300 mt-2">
            {patientName}
          </div>
        </div>
      </div>

      {analysis.flags.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-amber-100">Detected Fraud Flags</h4>
          {analysis.flags.map((flag, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border-l-4 ${
                flag.severity === 'HIGH'
                  ? 'bg-red-900/20 border-red-500'
                  : flag.severity === 'MEDIUM'
                    ? 'bg-amber-900/20 border-amber-500'
                    : 'bg-blue-900/20 border-blue-500'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  flag.severity === 'HIGH'
                    ? 'text-red-400'
                    : flag.severity === 'MEDIUM'
                      ? 'text-amber-400'
                      : 'text-blue-400'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${
                    flag.severity === 'HIGH'
                      ? 'text-red-300'
                      : flag.severity === 'MEDIUM'
                        ? 'text-amber-300'
                        : 'text-blue-300'
                  }`}>
                    {flag.type}
                  </p>
                  <p className="text-xs text-slate-300 mt-1">{flag.explanation}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${severityColors[flag.severity] || 'text-slate-300'}`}>
                      {flag.severity}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${flag.detectedBy === 'ai' ? 'bg-purple-900/30 text-purple-300' : 'bg-orange-900/30 text-orange-300'}`}>
                      {flag.detectedBy === 'ai' ? 'AI Detection' : 'Rule-Based'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {analysis.flags.length === 0 && (
        <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/50 flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-100">No Fraud Flags Detected</p>
            <p className="text-xs text-green-200 mt-1">Prescription pattern appears normal</p>
          </div>
        </div>
      )}

      <div className="p-3 bg-slate-800 rounded border border-slate-700 text-xs text-slate-400">
        <p className="font-semibold text-slate-300 mb-1">📋 Analysis Summary</p>
        <p className="mb-2">{analysis.summary}</p>
        <p className="text-slate-500 italic">{analysis.disclaimer}</p>
      </div>

      <button
        onClick={onRerun}
        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded transition-colors"
      >
        Re-run Fraud Detection
      </button>
    </div>
  )
}
