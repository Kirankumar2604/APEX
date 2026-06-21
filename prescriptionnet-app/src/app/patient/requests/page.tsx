'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  ShieldCheck,
  XCircle,
  CheckCircle,
  Clock,
  Filter,
  Lock
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge, { statusToBadgeVariant } from '@/components/ui/Badge'
import { getAllUsers } from '@/data/mockData'
import { getAccessRequests, denyRequest, getConsents, revokeConsent, updateRequestStatus } from '@/lib/consent'
import type { User, AccessRequest } from '@/types'
import SignatureVerifier from '@/components/crypto/SignatureVerifier'
import { patientAuthorizeAccess } from '@/lib/cryptoIntegration'
import FingerprintModal from '@/components/crypto/FingerprintModal'

/* ============================================
   Patient — Access Requests Page
   Shows pending/active/denied requests
   with real ECDSA signature on authorize
   ============================================ */

type FilterTab = 'all' | 'pending' | 'active' | 'denied'

export default function PatientRequestsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [filter, setFilter] = useState<FilterTab>('all')
  const [signingRequest, setSigningRequest] = useState<AccessRequest | null>(null)
  const [biometricRequest, setBiometricRequest] = useState<AccessRequest | null>(null)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [isSessionUnlocked, setIsSessionUnlocked] = useState(true)
  const [triggerSessionScan, setTriggerSessionScan] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('prescriptionnet_currentUser')
    if (!stored) { router.push('/'); return }
    const user = JSON.parse(stored)
    if (user.role !== 'patient') { router.push('/'); return }
    setCurrentUser(user)
    loadRequests(user.id)
    
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

  const loadRequests = (patientId: string) => {
    setRequests(getAccessRequests(patientId))
  }

  const refreshRequests = () => {
    if (currentUser) loadRequests(currentUser.id)
  }

  const handleDeny = (requestId: string) => {
    if (currentUser) {
      denyRequest(requestId, currentUser.id)
      refreshRequests()
    }
  }

  const handleRevoke = (requestId: string) => {
    if (currentUser) {
      const consents = getConsents(currentUser.id)
      const consent = consents.find(c => c.requestId === requestId && c.status === 'active')
      if (consent) {
        revokeConsent(consent.id, currentUser.id)
      }
      updateRequestStatus(requestId, 'revoked')
      refreshRequests()
    }
  }

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true
    if (filter === 'denied') return r.status === 'revoked' || r.status === 'expired'
    return r.status === filter
  })

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const activeCount = requests.filter(r => r.status === 'active').length

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

  const FILTER_TABS: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: requests.length },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'active', label: 'Approved', count: activeCount },
    { key: 'denied', label: 'Denied' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div className="animate-fade-in" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <Bell className="w-6 h-6" style={{ color: '#f97316' }} />
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9' }}>
              Access Requests
            </h1>
            {pendingCount > 0 && (
              <Badge variant="warning" size="sm">{pendingCount} pending</Badge>
            )}
          </div>
          <p style={{ fontSize: '15px', color: '#64748b' }}>
            Review and authorize data access requests with your cryptographic signature
          </p>
        </div>

        {/* Filter Tabs */}
        <div
          className="animate-fade-in"
          style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '24px',
            padding: '4px',
            borderRadius: '12px',
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid #334155',
            width: 'fit-content',
          }}
        >
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: filter === tab.key ? '#f1f5f9' : '#94a3b8',
                background: filter === tab.key
                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                  : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 200ms',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '6px',
                    background: filter === tab.key ? 'rgba(255,255,255,0.2)' : 'rgba(148,163,184,0.15)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Request Cards */}
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredRequests.length === 0 ? (
            <Card id="card-no-requests">
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Filter className="w-10 h-10 mx-auto" style={{ color: '#334155', marginBottom: '12px' }} />
                <p style={{ color: '#64748b', fontSize: '14px' }}>No requests match this filter</p>
              </div>
            </Card>
          ) : (
            filteredRequests.map((request) => {
              const requester = getAllUsers().find(u => u.id === request.requesterId)
              const isPending = request.status === 'pending'
              const isActive = request.status === 'active'
              const isDenied = request.status === 'revoked' || request.status === 'expired'

              return (
                <div
                  key={request.id}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: `1px solid ${isPending ? '#f9731640' : isActive ? '#22c55e30' : '#33415580'}`,
                    backdropFilter: 'blur(8px)',
                    transition: 'all 200ms',
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isPending ? 'rgba(249, 115, 22, 0.1)' : isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          border: `1px solid ${isPending ? '#f9731630' : isActive ? '#22c55e30' : '#33415560'}`,
                          fontSize: '16px',
                          fontWeight: 700,
                          color: isPending ? '#f97316' : isActive ? '#22c55e' : '#64748b',
                        }}
                      >
                        {(requester?.name || request.requesterName).charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>
                          {requester?.name || request.requesterName}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748b' }}>
                          {request.requesterRole} • {new Date(request.requestedAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusToBadgeVariant(request.status)} size="sm" dot>
                      {isDenied ? 'denied' : request.status}
                    </Badge>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <Badge variant="info" size="sm">{request.purpose}</Badge>
                    <Badge variant="neutral" size="sm">{request.scope}</Badge>
                    <Badge variant="neutral" size="sm">
                      <Clock className="w-3 h-3" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {request.duration}
                    </Badge>
                  </div>

                  {/* Message */}
                  {request.message && (
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', fontStyle: 'italic', lineHeight: 1.5 }}>
                      &ldquo;{request.message}&rdquo;
                    </p>
                  )}

                  {/* Action buttons — only for pending */}
                  {isPending && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        id={`authorize-${request.id}`}
                        onClick={() => {
                          if (biometricEnabled) {
                            setBiometricRequest(request)
                          } else {
                            setSigningRequest(request)
                          }
                        }}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 200ms',
                          boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)',
                        }}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Authorize Access
                      </button>
                      <button
                        id={`deny-${request.id}`}
                        onClick={() => handleDeny(request.id)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 200ms',
                        }}
                      >
                        <XCircle className="w-4 h-4" />
                        Deny
                      </button>
                    </div>
                  )}

                  {/* Active badge */}
                  {isActive && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(34, 197, 94, 0.08)',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                        }}
                      >
                        <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                        <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 500 }}>
                          Access authorized — cryptographically signed
                        </span>
                      </div>
                      
                      <button
                        id={`revoke-${request.id}`}
                        onClick={() => handleRevoke(request.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 200ms',
                          width: 'fit-content',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        Deactivate Access
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* Signature Verifier Modal */}
      {signingRequest && (
        <SignatureVerifier
          consentData={{
            requesterId: signingRequest.requesterId,
            requesterName: signingRequest.requesterName,
            scope: signingRequest.scope,
            purpose: signingRequest.purpose,
            duration: signingRequest.duration,
          }}
          patientId={currentUser.id}
          onSigned={async () => {
            try {
              await patientAuthorizeAccess(currentUser.id, signingRequest)
            } catch (error) {
              console.error('Authorization failed:', error)
            }
            setSigningRequest(null)
            refreshRequests()
          }}
          onCancel={() => setSigningRequest(null)}
        />
      )}

      {/* Biometric Scan Verification Modal */}
      {biometricRequest && (
        <FingerprintModal
          mode="verify"
          patientId={currentUser.id}
          patientName={currentUser.name}
          onSuccess={() => {
            setSigningRequest(biometricRequest)
            setBiometricRequest(null)
          }}
          onCancel={() => setBiometricRequest(null)}
        />
      )}
    </div>
  )
}
