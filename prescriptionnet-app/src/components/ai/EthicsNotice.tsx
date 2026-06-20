'use client'

import { AlertCircle } from 'lucide-react'

interface EthicsNoticeProps {
  variant?: 'banner' | 'inline' | 'footer'
}

const variants = {
  banner: 'bg-blue-900/30 border border-blue-500/50 p-4',
  inline: 'bg-blue-900/20 border-l-2 border-blue-500 p-3',
  footer: 'bg-slate-800 border-t border-slate-700 p-3',
}

const textSizes = {
  banner: 'text-sm',
  inline: 'text-xs',
  footer: 'text-xs',
}

export function EthicsNotice({ variant = 'footer' }: EthicsNoticeProps) {
  return (
    <div className={variants[variant]}>
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className={`font-semibold text-blue-100 ${textSizes[variant]}`}>
            AI-Generated Analysis for Physician Review Only
          </p>
          <p className={`text-blue-100/70 mt-1 ${textSizes[variant]}`}>
            This analysis is powered by Claude AI and provided for clinical decision support. 
            All findings must be reviewed and validated by qualified healthcare professionals. 
            AI should never replace clinical judgment.
          </p>
        </div>
      </div>
    </div>
  )
}
