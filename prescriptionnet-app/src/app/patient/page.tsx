'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Pill,
  FileText,
  Bell,
  AlertTriangle,
  Activity,
  Lock
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import StatCard from '@/components/dashboard/StatCard'
import Card from '@/components/ui/Card'
import Badge, { riskToBadgeVariant, statusToBadgeVariant } from '@/components/ui/Badge'
import CountdownTimer from '@/components/dashboard/CountdownTimer'
import { getVaultByPatientId, getSafetyByPatientId, MOCK_USERS } from '@/data/mockData'
import { getAccessRequests, getActiveConsents } from '@/lib/consent'
import type { User, AccessRequest, Consent } from '@/types'
import FingerprintModal from '@/components/crypto/FingerprintModal'

export default function PatientDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([])
  const [activeConsents, setActiveConsents] = useState<Consent[]>([])
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [registeringBiometric, setRegisteringBiometric] = useState(false)
  const [isSessionUnlocked, setIsSessionUnlocked] = useState(true)
  const [triggerSessionScan, setTriggerSessionScan] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('prescriptionnet_currentUser')
    if (!stored) { router.push('/'); return }
    const user = JSON.parse(stored)
    if (user.role !== 'patient') { router.push('/'); return }
    setCurrentUser(user)

    // Load dynamically from localStorage
    setPendingRequests(getAccessRequests(user.id).filter(r => r.status === 'pending'))
    setActiveConsents(getActiveConsents(user.id))
    
    const bioEnabled = localStorage.getItem('prescriptionnet_biometric_2fa') === 'true' || 
                       localStorage.getItem(`prescriptionnet_biometric_2fa_${user.id}`) === 'true'
    setBiometricEnabled(bioEnabled)

    const isVerified = sessionStorage.getItem(`prescriptionnet_biometric_verified_${user.id}`) === 'true'
    if (bioEnabled && !isVerified) {
      setIsSessionUnlocked(false)
    } else {
      setIsSessionUnlocked(true)
    }
  }, [router])

  const handleToggleBiometric = () => {
    if (biometricEnabled) {
      localStorage.setItem('prescriptionnet_biometric_2fa', 'false')
      if (currentUser) {
        localStorage.setItem(`prescriptionnet_biometric_2fa_${currentUser.id}`, 'false')
      }
      setBiometricEnabled(false)
    } else {
      setRegisteringBiometric(true)
    }
  }

  if (!currentUser) return null

  if (!isSessionUnlocked) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a' }}>
        <Navbar />
        <main style={{ maxWidth: '600px', margin: '80px auto', padding: '0 24px' }}>
          <Card
            id="card-session-locked"
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock className="w-5 h-5 text-cyan-400" />
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
                  Sovereign Vault Locked
                </span>
              </div>
            }
          >
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <Lock className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>
                2FA Biometric Authentication Required
              </h3>
              <p style={{ fontSize: '14.5px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
                Your sovereign medical vault is locked with biometric 2FA. Scan your fingerprint to decrypt and access your records.
              </p>
              <button
                onClick={() => {
                  setTriggerSessionScan(true)
                }}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Scan Fingerprint to Unlock
              </button>
            </div>
          </Card>
        </main>

        {(triggerSessionScan || true) && (
          <FingerprintModal
            mode="verify"
            patientId={currentUser.id}
            patientName={currentUser.name}
            onSuccess={() => {
              sessionStorage.setItem(`prescriptionnet_biometric_verified_${currentUser.id}`, 'true')
              setIsSessionUnlocked(true)
              setTriggerSessionScan(false)
            }}
            onCancel={() => {
              localStorage.removeItem('prescriptionnet_currentUser')
              sessionStorage.clear()
              router.push('/')
            }}
          />
        )}
      </div>
    )
  }

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

          {/* Security & 2FA Settings */}
          <Card
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck className="w-4 h-4" style={{ color: '#06b6d4' }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                  Security & 2FA Settings
                </span>
              </div>
            }
            id="card-security-settings"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>Biometric Fingerprint 2FA</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.4 }}>
                    Require a fingerprint biometric scan before approving any access request.
                  </p>
                </div>
                <button
                  onClick={handleToggleBiometric}
                  style={{
                    background: biometricEnabled ? '#06b6d4' : '#1e293b',
                    border: `1px solid ${biometricEnabled ? '#06b6d4' : '#334155'}`,
                    borderRadius: '20px',
                    width: '48px',
                    height: '24px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    padding: 0
                  }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: biometricEnabled ? '#0f172a' : '#94a3b8',
                      position: 'absolute',
                      top: '2px',
                      left: biometricEnabled ? '26px' : '3px',
                      transition: 'all 0.2s'
                    }}
                  />
                </button>
              </div>

              {biometricEnabled && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(6, 182, 212, 0.06)',
                  border: '1px solid rgba(6, 182, 212, 0.15)',
                  fontSize: '12px',
                  color: '#22d3ee',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Fingerprint biometric registered & active.</span>
                </div>
              )}
            </div>
          </Card>

        </div>
      </main>

      {/* Biometric Scan Registration Modal */}
      {registeringBiometric && (
        <FingerprintModal
          mode="register"
          patientId={currentUser.id}
          patientName={currentUser.name}
          onSuccess={() => {
            localStorage.setItem('prescriptionnet_biometric_2fa', 'true')
            localStorage.setItem(`prescriptionnet_biometric_2fa_${currentUser.id}`, 'true')
            setBiometricEnabled(true)
            setRegisteringBiometric(false)
          }}
          onCancel={() => setRegisteringBiometric(false)}
        />
      )}
    </div>
  )
}
