'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Database, ShieldCheck, TestTube2, Trash2 } from 'lucide-react'
import { initializeMockData, resetMockData, getAllVaults, getAllUsers, getVaultByPatientId } from '@/lib/mockData'
import { submitAccessRequest, createConsent, logDataAccess } from '@/lib/consent'
import { verifyLedgerIntegrity } from '@/lib/ledger'

export default function DataTestPage() {
  const [snapshot, setSnapshot] = useState<Record<string, unknown>>({})
  const [allVaults, setAllVaults] = useState<unknown[]>([])
  const [verificationResult, setVerificationResult] = useState<string>('')
  const [flowResult, setFlowResult] = useState<string>('')

  const refreshSnapshot = () => {
    if (typeof window === 'undefined') return
    const current: Record<string, unknown> = {}
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (!key) continue
      const raw = localStorage.getItem(key)
      try {
        current[key] = raw ? JSON.parse(raw) : null
      } catch {
        current[key] = raw
      }
    }
    setSnapshot(current)
  }

  useEffect(() => {
    refreshSnapshot()
  }, [])

  const handleInitialize = async () => {
    await initializeMockData()
    setVerificationResult('')
    setFlowResult('')
    refreshSnapshot()
  }

  const handleViewVaults = () => {
    setAllVaults(getAllVaults())
    refreshSnapshot()
  }

  const handleTestConsentFlow = () => {
    const request = submitAccessRequest({
      requesterId: 'requester-001',
      requesterName: 'Apollo Pharmacy',
      requesterRole: 'requester',
      patientId: 'patient-001',
      purpose: 'Prescription Refill',
      scope: 'Prescriptions Only',
      duration: '1 Hour',
      message: 'Automated test flow from data-test page',
    })
    const consent = createConsent(request, 'test-signature-verified', 'encrypted-session-key')
    logDataAccess(consent.id, consent.requesterId, consent.patientId, 'Test flow access')
    setFlowResult(`Created request ${request.id} and consent ${consent.id}.`)
    refreshSnapshot()
  }

  const handleVerifyLedger = async () => {
    const result = await verifyLedgerIntegrity()
    setVerificationResult(result.message)
    refreshSnapshot()
  }

  const handleReset = async () => {
    await resetMockData()
    setVerificationResult('')
    setFlowResult('')
    setAllVaults([])
    refreshSnapshot()
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Data Test Console</h1>
          <p className="mt-2 text-slate-400">Mock data initialization, consent flow validation, and ledger verification.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ActionButton icon={<Database className="h-4 w-4" />} label="Initialize Mock Data" onClick={handleInitialize} />
          <ActionButton icon={<ShieldCheck className="h-4 w-4" />} label="View All Vaults" onClick={handleViewVaults} />
          <ActionButton icon={<TestTube2 className="h-4 w-4" />} label="Test Consent Flow" onClick={handleTestConsentFlow} />
          <ActionButton icon={<CheckCircle2 className="h-4 w-4" />} label="Verify Ledger" onClick={handleVerifyLedger} />
          <ActionButton icon={<Trash2 className="h-4 w-4" />} label="Reset All Data" onClick={handleReset} />
        </div>

        {verificationResult ? <Message tone="cyan" text={verificationResult} /> : null}
        {flowResult ? <Message tone="emerald" text={flowResult} /> : null}

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel title="All Vaults">
            <pre className="max-h-[28rem] overflow-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
              {JSON.stringify(allVaults.length > 0 ? allVaults : getAllVaults(), null, 2)}
            </pre>
          </Panel>
          <Panel title="LocalStorage Snapshot">
            <pre className="max-h-[28rem] overflow-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
              {JSON.stringify(snapshot, null, 2)}
            </pre>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel title="Users">
            <pre className="overflow-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
              {JSON.stringify(getAllUsers(), null, 2)}
            </pre>
          </Panel>
          <Panel title="Sample Vault Lookup">
            <pre className="overflow-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
              {JSON.stringify(getVaultByPatientId('patient-001'), null, 2)}
            </pre>
          </Panel>
        </section>
      </div>
    </main>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void | Promise<void>
}) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-500/40 hover:bg-slate-800"
    >
      {icon}
      {label}
    </button>
  )
}

function Panel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">{title}</h2>
      {children}
    </div>
  )
}

function Message({
  tone,
  text,
}: {
  tone: 'cyan' | 'emerald'
  text: string
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${tone === 'cyan' ? 'border-cyan-500/30 bg-cyan-950/30 text-cyan-200' : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200'}`}>
      {text}
    </div>
  )
}
