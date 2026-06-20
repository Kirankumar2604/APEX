'use client'

interface EthicsNoticeProps {
  variant?: 'banner' | 'inline' | 'footer'
  showIcon?: boolean
  className?: string
}

const icons = {
  banner: '⚠️',
  inline: 'ℹ️',
  footer: '🔒'
}

export function EthicsNotice({ variant = 'banner', showIcon = true, className = '' }: EthicsNoticeProps) {
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 rounded-xl border border-amber-500 bg-amber-950/80 px-4 py-2 text-sm text-amber-100 ${className}`}>
        {showIcon ? <span>{icons.inline}</span> : null}
        <span>AI-assisted analysis — verify with healthcare provider</span>
      </div>
    )
  }

  if (variant === 'footer') {
    return (
      <div className={`rounded-2xl border border-slate-700 bg-slate-950/90 px-6 py-4 text-center text-sm text-slate-400 ${className}`}>
        <div className="font-medium text-slate-200">AI-Generated Medical Insights — For Physician Review Only</div>
        <div className="mt-1">Analysis performed by Anthropic Claude | Explainable AI</div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border border-amber-800 bg-amber-950/90 px-6 py-4 text-amber-50 ${className}`}>
      <div className="flex items-start gap-3">
        {showIcon ? <span className="text-2xl">{icons.banner}</span> : null}
        <div>
          <div className="font-semibold">AI-Generated Medical Insights — For Physician Review Only</div>
          <p className="mt-1 text-sm text-amber-100/90">
            This analysis is produced by an AI system and must be reviewed by a qualified healthcare professional before any clinical decisions are made. AI insights do not constitute medical advice.
          </p>
        </div>
      </div>
    </div>
  )
}

export default EthicsNotice
