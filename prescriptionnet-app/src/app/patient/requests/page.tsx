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
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge, { statusToBadgeVariant } from '@/components/ui/Badge'
import { MOCK_USERS, MOCK_ACCESS_REQUESTS } from '@/data/mockData'
import type { User, AccessRequest } from '@/types'
import SignatureVerifier from '@/components/crypto/SignatureVerifier'
import { patientAuthorizeAccess } from '@/lib/cryptoIntegration'

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

  useEffect(() => {
    const stored = localStorage.getItem('prescriptionnet_currentUser')
    if (!stored) { router.push('/'); return }
    const user = JSON.parse(stored)
    if (user.role !== 'patient') { router.push('/'); return }
    setCurrentUser(user)
    loadRequests(user.id)
  }, [router])

  const loadRequests = (patientId: string) => {
    // Load from localStorage first (persisted), then fall back to mock
    const storedRequests = localStorage.getItem('prescriptionnet_requests')
    if (storedRequests) {
      const all: AccessRequest[] = JSON.parse(storedRequests)
      setRequests(all.filter(r => r.patientId === patientId))
    } else {
      const filtered = MOCK_ACCESS_REQUESTS.filter(r => r.patientId === patientId)
      setRequests(filtered)
      // Persist mock data
      localStorage.setItem('prescriptionnet_requests', JSON.stringify(MOCK_ACCESS_REQUESTS))
    }
  }

  const refreshRequests = () => {
    if (currentUser) loadRequests(currentUser.id)
  }

  const handleDeny = (requestId: string) => {
    const storedRequests: AccessRequest[] = JSON.parse(
      localStorage.getItem('prescriptionnet_requests') || '[]'
    )
    const idx = storedRequests.findIndex(r => r.id === requestId)
    if (idx !== -1) {
      storedRequests[idx].status = 'expired'
      localStorage.setItem('prescriptionnet_requests', JSON.stringify(storedRequests))
      refreshRequests()
    }
  }

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true
    if (filter === 'denied') return r.status === 'expired'
    return r.status === filter
  })

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const activeCount = requests.filter(r => r.status === 'active').length

  if (!currentUser) return null

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
              const requester = MOCK_USERS.find(u => u.id === request.requesterId)
              const isPending = request.status === 'pending'
              const isActive = request.status === 'active'
              const isDenied = request.status === 'expired'

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
                        onClick={() => setSigningRequest(request)}
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
    </div>
  )
}
