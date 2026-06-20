'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Pill,
  FileText,
  Bell,
  AlertTriangle,
  Activity
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import StatCard from '@/components/dashboard/StatCard'
import Card from '@/components/ui/Card'
import Badge, { riskToBadgeVariant, statusToBadgeVariant } from '@/components/ui/Badge'
import CountdownTimer from '@/components/dashboard/CountdownTimer'
import { getVaultByPatientId, getSafetyByPatientId } from '@/data/mockData'
import { getAccessRequests, getActiveConsents } from '@/lib/consent'
import type { User, AccessRequest, Consent } from '@/types'

export default function PatientDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([])
  const [activeConsents, setActiveConsents] = useState<Consent[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('prescriptionnet_currentUser')
    if (!stored) { router.push('/'); return }
    const user = JSON.parse(stored)
    if (user.role !== 'patient') { router.push('/'); return }
    setCurrentUser(user)

    // Load dynamically from localStorage
    setPendingRequests(getAccessRequests(user.id).filter(r => r.status === 'pending'))
    setActiveConsents(getActiveConsents(user.id))
  }, [router])

  if (!currentUser) return null

  const vault = getVaultByPatientId(currentUser.id)
  const safety = getSafetyByPatientId(currentUser.id)

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Greeting */}
        <div className="animate-fade-in" style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>
            Welcome back, {currentUser.name.split(' ')[0]}
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b' }}>
            Your health data sovereign dashboard
          </p>
        </div>

        {/* Stat cards */}
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
            icon={<Pill className="w-5 h-5" />}
            label="Active Prescriptions"
            value={vault?.prescriptions.filter(p => p.isActive).length ?? 0}
            color="blue"
            id="stat-prescriptions"
          />
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Lab Reports"
            value={vault?.labReports.length ?? 0}
            color="cyan"
            id="stat-lab-reports"
          />
          <StatCard
            icon={<Bell className="w-5 h-5" />}
            label="Pending Requests"
            value={pendingRequests.length}
            color={pendingRequests.length > 0 ? 'orange' : 'green'}
            trend={pendingRequests.length > 0 ? { direction: 'up', text: 'Action needed' } : undefined}
            id="stat-pending-requests"
          />
          <StatCard
            icon={<ShieldCheck className="w-5 h-5" />}
            label="Safety Risk"
            value={safety.overallRiskLevel}
            riskLevel={safety.overallRiskLevel}
            id="stat-safety-risk"
          />
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '20px'
          }}
        >
          {/* Pending Access Requests */}
          <Card
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell className="w-4 h-4" style={{ color: '#f97316' }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                  Pending Access Requests
                </span>
                {pendingRequests.length > 0 && (
                  <Badge variant="warning" size="sm">{pendingRequests.length}</Badge>
                )}
              </div>
            }
            id="card-pending-requests"
          >
            {pendingRequests.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                No pending requests
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingRequests.map(req => (
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
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{req.requesterName}</p>
                        <p style={{ fontSize: '12px', color: '#64748b' }}>{req.requesterRole}</p>
                      </div>
                      <Badge variant={statusToBadgeVariant(req.status)} size="sm" dot>{req.status}</Badge>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Badge variant="info" size="sm">{req.purpose}</Badge>
                      <Badge variant="neutral" size="sm">{req.scope}</Badge>
                      <Badge variant="neutral" size="sm">{req.duration}</Badge>
                    </div>
                    {req.message && (
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic' }}>
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Active Consents */}
          <Card
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck className="w-4 h-4" style={{ color: '#22c55e' }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                  Active Consents
                </span>
                {activeConsents.length > 0 && (
                  <Badge variant="success" size="sm">{activeConsents.length}</Badge>
                )}
              </div>
            }
            id="card-active-consents"
          >
            {activeConsents.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                No active consents
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeConsents.map(consent => {
                  const requester = MOCK_USERS.find(u => u.id === consent.requesterId)
                  return (
                    <div
                      key={consent.id}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid #334155'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
                          {requester?.name ?? consent.requesterId}
                        </p>
                        <Badge variant="success" size="sm" dot>Active</Badge>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <Badge variant="info" size="sm">{consent.purpose}</Badge>
                        <Badge variant="neutral" size="sm">{consent.scope}</Badge>
                      </div>
                      <CountdownTimer expiresAt={consent.expiresAt} compact />
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Safety Overview */}
          {safety.overallRiskLevel !== 'SAFE' && (
            <Card
              borderAccent={safety.overallRiskLevel === 'HIGH' ? '#ef4444' : '#f97316'}
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: safety.overallRiskLevel === 'HIGH' ? '#ef4444' : '#f97316' }} />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                    Safety Alerts
                  </span>
                  <Badge variant={riskToBadgeVariant(safety.overallRiskLevel)} size="sm">
                    {safety.overallRiskLevel} RISK
                  </Badge>
                </div>
              }
              id="card-safety-alerts"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {safety.drugInteractions.map((di, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Badge variant={riskToBadgeVariant(di.severity)} size="sm">{di.severity}</Badge>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                        {di.drugs.join(' + ')}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>{di.explanation}</p>
                  </div>
                ))}
                {safety.medicationSafetyRisks.map((risk, i) => (
                  <div
                    key={`risk-${i}`}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'rgba(249, 115, 22, 0.05)',
                      border: '1px solid rgba(249, 115, 22, 0.15)'
                    }}
                  >
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#f97316', marginBottom: '4px' }}>{risk.risk}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>{risk.explanation}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Info */}
          <Card
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity className="w-4 h-4" style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                  Health Profile
                </span>
              </div>
            }
            id="card-health-profile"
          >
            {vault && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <p className="data-label" style={{ marginBottom: '4px' }}>Blood Group</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9' }}>{vault.bloodGroup}</p>
                </div>
                <div>
                  <p className="data-label" style={{ marginBottom: '4px' }}>Date of Birth</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
                    {new Date(vault.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="data-label" style={{ marginBottom: '4px' }}>Allergies</p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {vault.allergies.length === 0 ? (
                      <Badge variant="success" size="sm">None</Badge>
                    ) : (
                      vault.allergies.map(a => (
                        <Badge key={a} variant="danger" size="sm">{a}</Badge>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <p className="data-label" style={{ marginBottom: '4px' }}>Conditions</p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {vault.conditions.map(c => (
                      <Badge key={c} variant="warning" size="sm">{c}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
