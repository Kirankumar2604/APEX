'use client'

import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Brain, KeyRound, Lock } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import { getSystemStats } from '@/lib/consent'

export function SystemHealth() {
  const [stats, setStats] = useState(getSystemStats())
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString())

  useEffect(() => {
    const refresh = () => {
      setStats(getSystemStats())
      setLastUpdated(new Date().toISOString())
    }

    refresh()
    const interval = window.setInterval(refresh, 30000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Activity className="h-5 w-5 text-emerald-300" />
            System Health
          </h2>
          <p className="mt-1 text-sm text-slate-500">All Systems Secure</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3 py-1.5 text-sm text-emerald-200">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          Healthy
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Lock className="h-5 w-5" />} label="Total Encrypted Records" value={stats.totalEncryptedRecords} color="blue" />
        <StatCard icon={<KeyRound className="h-5 w-5" />} label="Active Consents" value={stats.activeConsents} color="green" />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Fraud Alerts Today"
          value={stats.fraudAlertsToday}
          color={stats.fraudAlertsToday > 0 ? 'red' : 'orange'}
        />
        <StatCard icon={<Brain className="h-5 w-5" />} label="AI Analyses Run" value={stats.aiAnalysesToday} color="cyan" />
      </div>

      <p className="text-xs text-slate-500">
        Last updated {new Date(lastUpdated).toLocaleString()}
      </p>
    </div>
  )
}
