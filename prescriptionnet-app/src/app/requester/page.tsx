'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardList,
  Search,
  CheckCircle,
  Clock
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import StatCard from '@/components/dashboard/StatCard'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { MOCK_ACCESS_REQUESTS, ALL_VAULTS } from '@/data/mockData'
import type { User } from '@/types'

export default function RequesterDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('prescriptionnet_currentUser')
    if (!stored) { router.push('/'); return }
    const user = JSON.parse(stored)
    if (user.role !== 'requester') { router.push('/'); return }
    setCurrentUser(user)
  }, [router])

  if (!currentUser) return null

  const myRequests = MOCK_ACCESS_REQUESTS.filter(r => r.requesterId === currentUser.id)
  const pendingRequests = myRequests.filter(r => r.status === 'pending')
  const activeRequests = myRequests.filter(r => r.status === 'active')

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        <div className="animate-fade-in" style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>
            Requester Portal
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b' }}>
            Welcome, {currentUser.name} — Verified data access
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
            icon={<ClipboardList className="w-5 h-5" />}
            label="Total Requests"
            value={myRequests.length}
            color="cyan"
            id="stat-total-requests"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending"
            value={pendingRequests.length}
            color="orange"
            id="stat-pending"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Active Access"
            value={activeRequests.length}
            color="green"
            id="stat-active-access"
          />
          <StatCard
            icon={<Search className="w-5 h-5" />}
            label="Available Patients"
            value={ALL_VAULTS.length}
            color="blue"
            id="stat-available-patients"
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '20px'
          }}
        >
          <Card
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList className="w-4 h-4" style={{ color: '#06b6d4' }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                  My Data Requests
                </span>
              </div>
            }
            id="card-my-data-requests"
          >
            {myRequests.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                No requests submitted yet
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
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{vault?.patientName ?? req.patientId}</p>
                          <p style={{ fontSize: '12px', color: '#64748b' }}>
                            Requested {new Date(req.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
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
                        <Badge variant="neutral" size="sm">{req.duration}</Badge>
                      </div>
                      {req.message && (
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic' }}>
                          &ldquo;{req.message}&rdquo;
                        </p>
                      )}
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
