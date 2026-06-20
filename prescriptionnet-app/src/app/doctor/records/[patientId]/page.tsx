'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Download, Lock, Pill, FileText, AlertTriangle, Zap } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ALL_VAULTS, MOCK_ACCESS_REQUESTS } from '@/data/mockData'
import { useAI } from '@/hooks/useAI'
import SafetyAgentResults from '@/components/ai/SafetyAgentResults'
import FraudDetectionResults from '@/components/ai/FraudDetectionResults'
import AILoadingState from '@/components/ai/AILoadingState'
import EthicsNotice from '@/components/ai/EthicsNotice'
import type { User, PatientVault } from '@/types'

type TabType = 'records' | 'safety' | 'fraud'

export default function PatientRecordsPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.patientId as string

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [vault, setVault] = useState<PatientVault | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('records')

  const {
    runSafetyAnalysis,
    runFraudDetection,
    safetyAnalysis,
    fraudAnalysis,
    isLoadingSafety,
    isLoadingFraud,
    safetyError,
    fraudError
  } = useAI()

  useEffect(() => {
    const stored = localStorage.getItem('prescriptionnet_currentUser')
    if (!stored) {
      router.push('/')
      return
    }
    const user = JSON.parse(stored) as User
    if (user.role !== 'doctor') {
      router.push('/')
      return
    }
    setCurrentUser(user)

    const patientVault = ALL_VAULTS.find((v) => v.patientId === patientId)
    if (!patientVault) {
      router.push('/doctor')
      return
    }
    setVault(patientVault)
  }, [router, patientId])

  if (!currentUser || !vault) return null

  const consent = MOCK_ACCESS_REQUESTS.find((r) => r.patientId === patientId && r.requesterId === currentUser.id && r.status === 'active')

  const tabStyle = (isActive: boolean) => ({
    padding: '12px 16px',
    borderRadius: '8px 8px 0 0',
    background: isActive ? '#1e293b' : 'transparent',
    border: isActive ? '1px solid #334155' : 'none',
    borderBottom: isActive ? '1px solid #1e293b' : '1px solid #334155',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    color: isActive ? '#f1f5f9' : '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s'
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.back()}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '8px'
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>
                {vault.patientName}
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                DOB: {vault.dateOfBirth} • Blood Group: {vault.bloodGroup}
              </p>
            </div>
          </div>
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
            Export Records
          </Button>
        </div>

        {/* Access Info Bar */}
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid #334155',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Lock className="w-5 h-5" style={{ color: '#3b82f6' }} />
            <div>
              <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>AUTHORIZED ACCESS</p>
              <p style={{ fontSize: '14px', color: '#f1f5f9' }}>
                {consent ? `Active consent via ${consent.purpose}` : 'No active consent'}
              </p>
            </div>
          </div>
          <Badge variant={consent ? 'success' : 'warning'} dot>
            {consent ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #334155' }}>
            <button
              onClick={() => setActiveTab('records')}
              style={tabStyle(activeTab === 'records')}
            >
              <FileText className="w-4 h-4" />
              Records
            </button>
            <button
              onClick={() => setActiveTab('safety')}
              style={tabStyle(activeTab === 'safety')}
            >
              <AlertTriangle className="w-4 h-4" />
              Clinical Safety
            </button>
            <button
              onClick={() => setActiveTab('fraud')}
              style={tabStyle(activeTab === 'fraud')}
            >
              <Zap className="w-4 h-4" />
              Fraud Analysis
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'records' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Prescriptions */}
            <Card
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pill className="w-4 h-4" style={{ color: '#3b82f6' }} />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                    Prescriptions ({vault.prescriptions.length})
                  </span>
                </div>
              }
              id="card-prescriptions"
            >
              {vault.prescriptions.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                  No prescriptions found
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {vault.prescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid #334155'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
                            {prescription.drugName}
                          </p>
                          <p style={{ fontSize: '12px', color: '#64748b' }}>
                            {prescription.dosage} • {prescription.frequency}
                          </p>
                        </div>
                        <Badge variant={prescription.isActive ? 'success' : 'neutral'} size="sm">
                          {prescription.isActive ? 'Active' : 'Expired'}
                        </Badge>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>
                        By {prescription.prescribedBy} on {prescription.prescribedDate}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Lab Reports */}
            <Card
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                    Lab Reports ({vault.labReports.length})
                  </span>
                </div>
              }
              id="card-lab-reports"
            >
              {vault.labReports.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                  No lab reports found
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {vault.labReports.map((report) => (
                    <div
                      key={report.id}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid #334155'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
                            {report.testName}
                          </p>
                          <p style={{ fontSize: '12px', color: '#64748b' }}>
                            Result: {report.result}
                          </p>
                        </div>
                        <Badge variant={report.isAbnormal ? 'danger' : 'success'} size="sm">
                          {report.isAbnormal ? 'Abnormal' : 'Normal'}
                        </Badge>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>
                        Reference: {report.referenceRange} • {report.conductedDate}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Patient Details */}
            <Card
              header={
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                  Patient Information
                </span>
              }
              id="card-patient-info"
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Allergies</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {vault.allergies.length > 0
                      ? vault.allergies.map((allergy) => (
                          <Badge key={allergy} variant="danger" size="sm">
                            {allergy}
                          </Badge>
                        ))
                      : <p style={{ fontSize: '13px', color: '#64748b' }}>None reported</p>}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Conditions</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {vault.conditions.length > 0
                      ? vault.conditions.map((condition) => (
                          <Badge key={condition} variant="info" size="sm">
                            {condition}
                          </Badge>
                        ))
                      : <p style={{ fontSize: '13px', color: '#64748b' }}>None</p>}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'safety' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <EthicsNotice variant="banner" />
            {isLoadingSafety && <AILoadingState type="safety" />}
            {safetyError && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5'
                }}
              >
                {safetyError}
              </div>
            )}
            {safetyAnalysis && (
              <SafetyAgentResults
                analysis={safetyAnalysis}
                patientName={vault.patientName}
                onRerun={() => runSafetyAnalysis(vault)}
              />
            )}
            {!isLoadingSafety && !safetyError && !safetyAnalysis && (
              <Card
                header={<span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Run Analysis</span>}
                id="card-run-safety"
              >
                <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
                  Click below to run a clinical safety analysis on this patient&apos;s prescriptions and data.
                </p>
                <Button onClick={() => runSafetyAnalysis(vault)} variant="primary">
                  Run AI Safety Analysis
                </Button>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'fraud' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {isLoadingFraud && <AILoadingState type="fraud" />}
            {fraudError && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5'
                }}
              >
                {fraudError}
              </div>
            )}
            {fraudAnalysis && (
              <FraudDetectionResults
                analysis={fraudAnalysis}
                patientName={vault.patientName}
                onRerun={() => runFraudDetection(vault)}
              />
            )}
            {!isLoadingFraud && !fraudError && !fraudAnalysis && (
              <Card
                header={<span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Run Analysis</span>}
                id="card-run-fraud"
              >
                <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
                  Click below to run fraud pattern detection on this patient&apos;s prescription history.
                </p>
                <Button onClick={() => runFraudDetection(vault)} variant="primary">
                  Run Fraud Detection
                </Button>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
