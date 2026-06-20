'use client'

import { useMemo, useState } from 'react'
import { Clock3, Download, FilePlus2, FlaskConical, History, Pill, Plus, Trash2 } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import { EncryptionStatus } from '@/components/crypto/EncryptionStatus'
import { useVault } from '@/hooks/useVault'
import { AddRecordModal } from './AddRecordModal'

interface VaultDashboardProps {
  patientId: string
}

type TabKey = 'prescriptions' | 'lab' | 'allergies' | 'history'

export function VaultDashboard({ patientId }: VaultDashboardProps) {
  const { vaultData, stats, addAllergy, removeAllergy, downloadVault, refreshVault } = useVault(patientId)
  const [activeTab, setActiveTab] = useState<TabKey>('prescriptions')
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [showLabModal, setShowLabModal] = useState(false)
  const [newAllergy, setNewAllergy] = useState('')

  const activePrescriptions = useMemo(
    () => vaultData?.prescriptions.filter((prescription) => prescription.isActive) ?? [],
    [vaultData]
  )

  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return
    await addAllergy(newAllergy.trim())
    setNewAllergy('')
  }

  const handleRemoveAllergy = async (allergy: string) => {
    await removeAllergy(allergy)
  }

  const statsSource = stats ?? {
    totalPrescriptions: 0,
    activePrescriptions: 0,
    totalLabReports: 0,
    abnormalLabReports: 0,
    totalAllergies: 0,
    lastUpdated: '',
  }

  if (!vaultData) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-slate-300">
        Vault not found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <EncryptionStatus
        isEncrypted={Boolean(vaultData)}
        algorithm="AES-256-GCM"
        keyFingerprint={patientId}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Pill className="h-5 w-5" />} label="Active Prescriptions" value={statsSource.activePrescriptions} color="green" />
        <StatCard icon={<FlaskConical className="h-5 w-5" />} label="Lab Reports" value={statsSource.totalLabReports} color="cyan" />
        <StatCard icon={<FilePlus2 className="h-5 w-5" />} label="Allergies" value={statsSource.totalAllergies} color="orange" />
        <StatCard icon={<AlertIndicator />} label="Abnormal Results" value={statsSource.abnormalLabReports} color={statsSource.abnormalLabReports > 0 ? 'red' : 'green'} />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
          {[
            ['prescriptions', 'Prescriptions'],
            ['lab', 'Lab Reports'],
            ['allergies', 'Allergies'],
            ['history', 'History'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as TabKey)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === key ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="pt-5">
          {activeTab === 'prescriptions' ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-100">Prescriptions</h2>
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  <Plus className="h-4 w-4" />
                  Add Prescription
                </button>
              </div>

              {activePrescriptions.length === 0 ? (
                <EmptyState icon={<Pill className="h-8 w-8" />} title="No active prescriptions" />
              ) : (
                activePrescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className={`rounded-2xl border bg-slate-900/80 p-4 ${
                      prescription.isActive ? 'border-emerald-500/30 border-l-4 border-l-emerald-500' : 'border-slate-700 border-l-4 border-l-slate-600'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{prescription.drugName}</h3>
                        <p className="mt-2 text-sm text-slate-400">{prescription.frequency}</p>
                        <p className="mt-1 text-xs text-slate-500">Prescribed by {prescription.prescribedBy}</p>
                      </div>
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm font-semibold text-cyan-300">
                        {prescription.dosage}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>Prescribed: {formatDate(prescription.prescribedDate)}</span>
                      <span>Expiry: {formatDate(prescription.expiryDate)}</span>
                      <span className={`rounded-full px-3 py-1 font-semibold ${prescription.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-300'}`}>
                        {prescription.isActive ? 'ACTIVE' : 'EXPIRED'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </section>
          ) : null}

          {activeTab === 'lab' ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-100">Lab Reports</h2>
                <button
                  type="button"
                  onClick={() => setShowLabModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  <Plus className="h-4 w-4" />
                  Add Lab Report
                </button>
              </div>

              {vaultData.labReports.length === 0 ? (
                <EmptyState icon={<FlaskConical className="h-8 w-8" />} title="No lab reports found" />
              ) : (
                vaultData.labReports.map((report) => (
                  <div
                    key={report.id}
                    className={`rounded-2xl border bg-slate-900/80 p-4 ${
                      report.isAbnormal ? 'border-rose-500/30 border-l-4 border-l-rose-500' : 'border-slate-700 border-l-4 border-l-emerald-500'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{report.testName}</h3>
                        <p className={`mt-2 text-sm font-semibold ${report.isAbnormal ? 'text-rose-300' : 'text-emerald-300'}`}>
                          {report.result}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{report.referenceRange}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          Conducted by {report.conductedBy} on {formatDate(report.conductedDate)}
                        </p>
                      </div>
                      {report.isAbnormal ? (
                        <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-300">
                          ABNORMAL
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </section>
          ) : null}

          {activeTab === 'allergies' ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">Allergies</h2>
              {vaultData.allergies.length === 0 ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-emerald-200">
                  No known allergies
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {vaultData.allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-950/30 px-4 py-2 text-sm font-semibold text-rose-200"
                    >
                      {allergy}
                      <button type="button" onClick={() => void handleRemoveAllergy(allergy)} className="text-rose-200 transition hover:text-white">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={newAllergy}
                  onChange={(event) => setNewAllergy(event.target.value)}
                  placeholder="Add new allergy"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => void handleAddAllergy()}
                  className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  Add Allergy
                </button>
              </div>
            </section>
          ) : null}

          {activeTab === 'history' ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">Medication History</h2>
              {vaultData.medicationHistory.length === 0 ? (
                <EmptyState icon={<History className="h-8 w-8" />} title="No medication history available" />
              ) : (
                <div className="space-y-3">
                  {vaultData.medicationHistory.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <Clock3 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-300" />
                      <p className="text-sm leading-6 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-20">
        <button
          type="button"
          onClick={downloadVault}
          className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20"
        >
          <Download className="h-4 w-4" />
          Download My Health Records
        </button>
      </div>

      <AddRecordModal
        patientId={patientId}
        type="prescription"
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        onAdded={refreshVault}
      />
      <AddRecordModal
        patientId={patientId}
        type="lab"
        isOpen={showLabModal}
        onClose={() => setShowLabModal(false)}
        onAdded={refreshVault}
      />
    </div>
  )
}

function EmptyState({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-12 text-center text-slate-400">
      <div className="mb-3 rounded-full bg-slate-800 p-4 text-slate-300">{icon}</div>
      <p className="text-sm">{title}</p>
    </div>
  )
}

function AlertIndicator() {
  return <span className="inline-flex h-5 w-5 rounded-full border-2 border-current" />
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
