'use client'

import { useMemo, useState } from 'react'
import { useAI } from '@/hooks/useAI'
import { SafetyAgentResults } from '@/components/ai/SafetyAgentResults'
import { FraudDetectionResults } from '@/components/ai/FraudDetectionResults'
import { AILoadingState } from '@/components/ai/AILoadingState'
import type { PatientVault } from '@/types'

const MOCK_PATIENTS: PatientVault[] = [
  {
    patientId: 'rajesh-kumar',
    patientName: 'Rajesh Kumar',
    dateOfBirth: '1974-05-11',
    bloodGroup: 'B+',
    allergies: ['NSAIDs', 'Ibuprofen'],
    conditions: ['Atrial Fibrillation', 'Heart Failure'],
    prescriptions: [
      { id: 'p1', patientId: 'rajesh-kumar', drugName: 'Warfarin', dosage: '5mg', frequency: 'Once daily', prescribedBy: 'Dr. Mehta', prescribedDate: '2026-06-01', expiryDate: '2026-06-30', isActive: true },
      { id: 'p2', patientId: 'rajesh-kumar', drugName: 'Digoxin', dosage: '0.25mg', frequency: 'Once daily', prescribedBy: 'Dr. Mehta', prescribedDate: '2026-06-05', expiryDate: '2026-07-05', isActive: true },
      { id: 'p3', patientId: 'rajesh-kumar', drugName: 'Aspirin', dosage: '75mg', frequency: 'Once daily', prescribedBy: 'Dr. Mehta', prescribedDate: '2026-06-01', expiryDate: '2026-06-30', isActive: true },
      { id: 'p4', patientId: 'rajesh-kumar', drugName: 'Aspirin', dosage: '150mg', frequency: 'Once daily', prescribedBy: 'Dr. Rao', prescribedDate: '2026-06-10', expiryDate: '2026-07-10', isActive: true },
      { id: 'p5', patientId: 'rajesh-kumar', drugName: 'Carvedilol', dosage: '6.25mg', frequency: 'Twice daily', prescribedBy: 'Dr. Mehta', prescribedDate: '2026-06-01', expiryDate: '2026-06-30', isActive: true }
    ],
    labReports: [
      { id: 'l1', patientId: 'rajesh-kumar', testName: 'INR', result: '3.8', referenceRange: '0.8-1.2', isAbnormal: true, conductedDate: '2026-06-08', conductedBy: 'LabCorp' },
      { id: 'l2', patientId: 'rajesh-kumar', testName: 'BNP', result: '820 pg/mL', referenceRange: '0-100 pg/mL', isAbnormal: true, conductedDate: '2026-06-08', conductedBy: 'LabCorp' },
      { id: 'l3', patientId: 'rajesh-kumar', testName: 'Serum Digoxin', result: '2.4 ng/mL', referenceRange: '0.5-2.0 ng/mL', isAbnormal: true, conductedDate: '2026-06-08', conductedBy: 'LabCorp' }
    ],
    medicationHistory: ['Warfarin prescribed for atrial fibrillation', 'Digoxin prescribed for heart failure', 'Aspirin therapy for antiplatelet prophylaxis'],
    emergencyAccessEnabled: false
  },
  {
    patientId: 'ananya-singh',
    patientName: 'Ananya Singh',
    dateOfBirth: '1989-11-23',
    bloodGroup: 'O+',
    allergies: ['None'],
    conditions: ['Anxiety'],
    prescriptions: [
      { id: 'p6', patientId: 'ananya-singh', drugName: 'Tramadol', dosage: '50mg', frequency: 'Every 8 hours', prescribedBy: 'Dr. Patel', prescribedDate: '2026-05-25', expiryDate: '2026-06-25', isActive: true },
      { id: 'p7', patientId: 'ananya-singh', drugName: 'Tramadol', dosage: '50mg', frequency: 'Every 8 hours', prescribedBy: 'Dr. Kumar', prescribedDate: '2026-06-02', expiryDate: '2026-07-02', isActive: true },
      { id: 'p8', patientId: 'ananya-singh', drugName: 'Alprazolam', dosage: '1mg', frequency: 'Once daily', prescribedBy: 'Dr. Patel', prescribedDate: '2026-06-01', expiryDate: '2026-06-30', isActive: true }
    ],
    labReports: [],
    medicationHistory: ['Tramadol refill requested twice in one month', 'Alprazolam started for anxiety'],
    emergencyAccessEnabled: false
  },
  {
    patientId: 'maya-verma',
    patientName: 'Maya Verma',
    dateOfBirth: '1995-02-14',
    bloodGroup: 'A-',
    allergies: ['Penicillin'],
    conditions: ['Hypertension'],
    prescriptions: [
      { id: 'p9', patientId: 'maya-verma', drugName: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', prescribedBy: 'Dr. Shah', prescribedDate: '2026-05-20', expiryDate: '2026-06-20', isActive: true },
      { id: 'p10', patientId: 'maya-verma', drugName: 'Losartan', dosage: '50mg', frequency: 'Once daily', prescribedBy: 'Dr. Shah', prescribedDate: '2026-05-20', expiryDate: '2026-06-20', isActive: true }
    ],
    labReports: [
      { id: 'l4', patientId: 'maya-verma', testName: 'Blood Pressure', result: '142/92 mmHg', referenceRange: '120/80 mmHg', isAbnormal: true, conductedDate: '2026-06-05', conductedBy: 'Health Clinic' }
    ],
    medicationHistory: ['Started hypertension therapy', 'No prior controlled substance prescriptions'],
    emergencyAccessEnabled: false
  }
]

export default function AITestPage() {
  const { safetyAnalysis, fraudAnalysis, isLoadingSafety, isLoadingFraud, safetyError, fraudError, runFullAnalysis, clearAnalysis } = useAI()
  const [selectedPatient, setSelectedPatient] = useState<PatientVault | null>(null)
  const [debugResponse, setDebugResponse] = useState<string>('')
  const [safetyTime, setSafetyTime] = useState<number | null>(null)

  const handleSelectPatient = async (patient: PatientVault) => {
    setSelectedPatient(patient)
    setDebugResponse('')
    setSafetyTime(null)
    clearAnalysis()

    const safetyStart = performance.now()
    try {
      const analysisPromise = runFullAnalysis(patient)
      const result = await analysisPromise
      setSafetyTime(Math.round(performance.now() - safetyStart))
      setDebugResponse(JSON.stringify(result, null, 2))
    } catch (error: unknown) {
      setDebugResponse(String(error))
    }
  }

  const pageNote = useMemo(() => 'Development-only AI test page. Use this page to verify API and UI integration with sample patients.', [])

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="text-xl font-semibold">AI Test Page</div>
          <p className="mt-2 text-sm text-slate-400">{pageNote}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {MOCK_PATIENTS.map((patient) => (
            <button
              key={patient.patientId}
              type="button"
              onClick={() => handleSelectPatient(patient)}
              className={`rounded-3xl border p-5 text-left transition hover:border-slate-500 ${selectedPatient?.patientId === patient.patientId ? 'border-sky-500 bg-slate-900' : 'border-slate-700 bg-slate-950'}`}>
              <div className="text-lg font-semibold text-white">{patient.patientName}</div>
              <div className="mt-2 text-sm text-slate-400">{patient.conditions.join(', ') || 'No conditions listed'}</div>
              <div className="mt-3 text-sm text-slate-500">{patient.prescriptions.length} prescriptions • {patient.allergies.length} allergies</div>
            </button>
          ))}
        </div>

        {selectedPatient ? (
          <div className="space-y-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xl font-semibold">Selected Patient: {selectedPatient.patientName}</div>
                {safetyTime !== null ? <div className="text-sm text-slate-400">Safety analysis completed in {safetyTime}ms</div> : null}
              </div>
            </div>

            {(isLoadingSafety || isLoadingFraud) && <AILoadingState type={isLoadingSafety ? 'safety' : 'fraud'} />}

            {safetyError ? <div className="rounded-3xl border border-red-700 bg-red-950/80 p-4 text-red-200">{safetyError}</div> : null}
            {fraudError ? <div className="rounded-3xl border border-red-700 bg-red-950/80 p-4 text-red-200">{fraudError}</div> : null}

            {safetyAnalysis ? <SafetyAgentResults analysis={safetyAnalysis} patientName={selectedPatient.patientName} onRerun={() => handleSelectPatient(selectedPatient)} /> : null}
            {fraudAnalysis ? <FraudDetectionResults analysis={fraudAnalysis} patientName={selectedPatient.patientName} onRerun={() => handleSelectPatient(selectedPatient)} /> : null}

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="text-lg font-semibold">Raw API / Debug Output</div>
              <pre className="mt-4 max-h-96 overflow-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-200">{debugResponse || 'No response captured yet.'}</pre>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
