'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, AlertCircle, FileText } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { AccessRequestForm } from '@/components/consent/AccessRequestForm'
import { getUserById } from '@/data/mockData'
import { getConsentForRequester } from '@/lib/consent'
import type { User } from '@/types'

export default function RequesterNewRequestPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchedPatientId, setSearchedPatientId] = useState('')
  const [patientName, setPatientName] = useState('')
  const [hasConsent, setHasConsent] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('prescriptionnet_currentUser')
    if (!stored) { router.push('/'); return }
    const user = JSON.parse(stored)
    if (user.role !== 'requester') { router.push('/'); return }
    setCurrentUser(user)
  }, [router])

  if (!currentUser) return null

  const handleSearch = () => {
    setSearchError('')
    setPatientName('')
    setSearchedPatientId('')
    setHasConsent(false)

    const query = searchQuery.trim()
    if (!query) {
      setSearchError('Please enter a patient ID.')
      return
    }

    const patientUser = getUserById(query)
    if (!patientUser || patientUser.role !== 'patient') {
      setSearchError(`No patient found with ID "${query}".`)
      return
    }

    const activeConsent = getConsentForRequester(patientUser.id, currentUser.id)

    setSearchedPatientId(patientUser.id)
    setPatientName(patientUser.name)
    setHasConsent(!!activeConsent)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>
            New Data Access Request
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b' }}>
            Configure and submit a signature-verified consent request to a patient
          </p>
        </div>

        {/* Search patient first */}
        <Card
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search className="w-4 h-4 text-cyan-400" />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                1. Search Patient
              </span>
            </div>
          }
          style={{ marginBottom: '24px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                placeholder="Enter Patient ID (e.g. patient-001)"
                style={{
                  flex: 1,
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#f1f5f9',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  background: '#06b6d4',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0 24px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
            </div>

            {searchError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontSize: '13px' }}>
                <AlertCircle className="w-4 h-4" />
                {searchError}
              </div>
            )}

            {searchedPatientId && (
              <div style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{patientName}</p>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Patient ID: {searchedPatientId}</p>
                </div>
                <div>
                  {hasConsent ? (
                    <Badge variant="success" dot>Access Authorized</Badge>
                  ) : (
                    <Badge variant="neutral" dot>No Active Consent</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Request Access Form */}
        <Card
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText className="w-4 h-4 text-cyan-400" />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                2. Configure Request
              </span>
            </div>
          }
        >
          {hasConsent ? (
            <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
              You already have active consent to access this patient's records.
            </p>
          ) : (
            <AccessRequestForm
              requesterId={currentUser.id}
              requesterName={currentUser.name}
              requesterRole={currentUser.role}
              initialPatientId={searchedPatientId}
              onSubmitted={() => {
                setSearchQuery('')
                setSearchedPatientId('')
                setPatientName('')
              }}
            />
          )}
        </Card>

      </main>
    </div>
  )
}
