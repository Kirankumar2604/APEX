'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Search,
  ShieldCheck,
  AlertTriangle,
  FileText
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import StatCard from '@/components/dashboard/StatCard'
import Card from '@/components/ui/Card'
import Badge, { riskToBadgeVariant } from '@/components/ui/Badge'
import { ALL_VAULTS, MOCK_ACCESS_REQUESTS, getSafetyByPatientId, getFraudByPatientId } from '@/data/mockData'
import type { User } from '@/types'

export default function DoctorDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('prescriptionnet_currentUser')
    if (!stored) { router.push('/'); return }
    const user = JSON.parse(stored)
    if (user.role !== 'doctor') { router.push('/'); return }
    setCurrentUser(user)
  }, [router])

  if (!currentUser) return null

  const myRequests = MOCK_ACCESS_REQUESTS.filter(r => r.requesterId === currentUser.id)
  const highRiskPatients = ALL_VAULTS.filter(v => getSafetyByPatientId(v.patientId).overallRiskLevel === 'HIGH')

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        <div className="animate-fade-in" style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>
            Doctor Dashboard
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b' }}>
            Welcome, {currentUser.name} — Authorized access portal
          </p>
        </div>

        <div
          className="animate-fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}
        >
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total Patients"
            value={ALL_VAULTS.length}
            color="green"
            id="stat-total-patients"
          />
          <StatCard
            icon={<Search className="w-5 h-5" />}
            label="My Requests"
            value={myRequests.length}
            color="blue"
            id="stat-my-requests"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="High Risk Patients"
            value={highRiskPatients.length}
            color="red"
            trend={highRiskPatients.length > 0 ? { direction: 'up', text: 'Review needed' } : undefined}
            id="stat-high-risk"
          />
          <StatCard
            icon={<ShieldCheck className="w-5 h-5" />}
            label="Active Consents"
            value={MOCK_ACCESS_REQUESTS.filter(r => r.status === 'active' && r.requesterId === currentUser.id).length}
            color="cyan"
            id="stat-active-consents"
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '20px'
          }}
        >
          {/* Patient Safety Overview */}
          <Card
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                  Patient Safety Overview
                </span>
              </div>
            }
            id="card-patient-safety"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ALL_VAULTS.map(vault => {
                const safety = getSafetyByPatientId(vault.patientId)
                const fraud = getFraudByPatientId(vault.patientId)
                return (
                  <div
                    key={vault.patientId}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid #334155'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{vault.patientName}</p>
                        <p style={{ fontSize: '12px', color: '#64748b' }}>
                          {vault.conditions.join(', ')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Badge variant={riskToBadgeVariant(safety.overallRiskLevel)} size="sm">
                          Safety: {safety.overallRiskLevel}
                        </Badge>
                        <Badge variant={fraud.fraudRiskScore > 60 ? 'danger' : fraud.fraudRiskScore > 30 ? 'warning' : 'success'} size="sm">
                          Fraud: {fraud.fraudRiskScore}%
                        </Badge>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Badge variant="neutral" size="sm">{vault.prescriptions.length} Rx</Badge>
                      <Badge variant="neutral" size="sm">{vault.labReports.length} Labs</Badge>
                      {vault.allergies.length > 0 && (
                        <Badge variant="danger" size="sm">{vault.allergies.length} Allergies</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* My Access Requests */}
          <Card
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText className="w-4 h-4" style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                  My Access Requests
                </span>
              </div>
            }
            id="card-my-requests"
          >
            {myRequests.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                No access requests sent
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myRequests.map(req => {
                  const vault = ALL_VAULTS.find(v => v.patientId === req.patientId)
                  return (
                    <div
                      key={req.id}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid #334155'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
                          {vault?.patientName ?? req.patientId}
                        </p>
                        <Badge
                          variant={req.status === 'active' ? 'success' : req.status === 'pending' ? 'warning' : 'neutral'}
                          size="sm"
                          dot
                        >
                          {req.status}
                        </Badge>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <Badge variant="info" size="sm">{req.purpose}</Badge>
                        <Badge variant="neutral" size="sm">{req.scope}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
