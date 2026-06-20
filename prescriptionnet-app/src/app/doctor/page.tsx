'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Search,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import StatCard from '@/components/dashboard/StatCard'
import Card from '@/components/ui/Card'
import Badge, { riskToBadgeVariant } from '@/components/ui/Badge'
import { 
  getAllVaults, 
  getUserById, 
  getSafetyByPatientId, 
  getFraudByPatientId 
} from '@/data/mockData'
import { 
  getAccessRequests, 
  getConsentForRequester, 
  submitAccessRequest 
} from '@/lib/consent'
import type { 
  User, 
  PatientVault, 
  AccessRequest,
  ConsentPurpose,
  ConsentScope,
  ConsentDuration
} from '@/types'

export default function DoctorDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  
  // Dynamic states from localStorage
  const [vaults, setVaults] = useState<PatientVault[]>([])
  const [myRequests, setMyRequests] = useState<AccessRequest[]>([])

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<{
    patientId: string
    patientName: string
    hasConsent: boolean
    hasPendingRequest: boolean
  } | null>(null)
  const [searchError, setSearchError] = useState('')

  // Request form states
  const [requestPurpose, setRequestPurpose] = useState<ConsentPurpose>('Consultation')
  const [requestScope, setRequestScope] = useState<ConsentScope>('Prescriptions Only')
  const [requestDuration, setRequestDuration] = useState<ConsentDuration>('24 Hours')
  const [requestMessage, setRequestMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('prescriptionnet_currentUser')
    if (!stored) { router.push('/'); return }
    const user = JSON.parse(stored)
    if (user.role !== 'doctor') { router.push('/'); return }
    setCurrentUser(user)

    // Load initial values from localStorage
    setVaults(getAllVaults())
    setMyRequests(getAccessRequests(undefined, user.id))
  }, [router])

  if (!currentUser) return null

  const highRiskPatients = vaults.filter(v => getSafetyByPatientId(v.patientId).overallRiskLevel === 'HIGH')
  const activeConsentsCount = myRequests.filter(r => r.status === 'active').length

  const handleSearch = () => {
    setSearchError('')
    setSearchResult(null)
    setSuccessMessage('')

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
    const requests = getAccessRequests(patientUser.id, currentUser.id)
    const hasPending = requests.some(r => r.status === 'pending')

    setSearchResult({
      patientId: patientUser.id,
      patientName: patientUser.name,
      hasConsent: !!activeConsent,
      hasPendingRequest: hasPending
    })
  }

  const handleSendRequest = () => {
    if (!searchResult) return

    submitAccessRequest({
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterRole: currentUser.role,
      patientId: searchResult.patientId,
      purpose: requestPurpose,
      scope: requestScope,
      duration: requestDuration,
      message: requestMessage.trim() || undefined
    })

    setSuccessMessage('Access request submitted. Awaiting patient approval.')
    
    // Refresh lists
    setMyRequests(getAccessRequests(undefined, currentUser.id))
    
    // Reset form states
    setRequestMessage('')
    setSearchResult(prev => prev ? { ...prev, hasPendingRequest: true } : null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Header Greeting */}
        <div className="animate-fade-in" style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>
            Doctor Dashboard
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b' }}>
            Welcome, {currentUser.name} — Authorized access portal
          </p>
        </div>

        {/* Search Patient strictly by ID */}
        <Card
          id="doctor-search-card"
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search className="w-4 h-4 text-cyan-400" />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                Search Patient by ID
              </span>
            </div>
          }
          style={{ marginBottom: '32px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              Enter the patient's unique ID to verify their identity and check access authorization.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                placeholder="Search by Patient ID only (e.g., patient-001)"
                style={{
                  flex: 1,
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#f1f5f9',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
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
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Search
              </button>
            </div>

            {searchResult && (
              <div
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: `1px solid ${searchResult.hasConsent ? '#22c55e' : searchResult.hasPendingRequest ? '#eab308' : '#334155'}`,
                  marginTop: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
                      {searchResult.patientName}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>Patient ID: {searchResult.patientId}</p>
                  </div>
                  <Badge
                    variant={searchResult.hasConsent ? 'success' : searchResult.hasPendingRequest ? 'warning' : 'neutral'}
                    dot
                  >
                    {searchResult.hasConsent ? 'Authorized Access' : searchResult.hasPendingRequest ? 'Access Pending' : 'No Consent'}
                  </Badge>
                </div>

                {searchResult.hasConsent ? (
                  <div>
                    <p style={{ fontSize: '13.5px', color: '#94a3b8', marginBottom: '14px' }}>
                      You have active, signature-verified consent to view this patient's medical records.
                    </p>
                    <button
                      onClick={() => router.push(`/doctor/records/${searchResult.patientId}`)}
                      style={{
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 20px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)'
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      View Full Records & AI Analysis
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '13.5px', color: '#94a3b8', marginBottom: '14px' }}>
                      {searchResult.hasPendingRequest
                        ? 'An access request has already been sent to this patient and is pending approval.'
                        : 'Access is unauthorized. Submit a signature-verified consent request to access the patient\'s health records.'}
                    </p>
                    
                    {successMessage && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: '#4ade80',
                        fontSize: '13px',
                        marginBottom: '14px'
                      }}>
                        <CheckCircle2 className="w-4 h-4" />
                        {successMessage}
                      </div>
                    )}

                    {!searchResult.hasPendingRequest && (
                      <div
                        style={{
                          borderTop: '1px solid #1e293b',
                          paddingTop: '16px',
                          marginTop: '12px'
                        }}
                      >
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '14px' }}>
                          Request Access Configuration
                        </h4>
                        
                        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '16px' }}>
                          <div>
                            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Purpose *</label>
                            <select
                              value={requestPurpose}
                              onChange={(e) => setRequestPurpose(e.target.value as ConsentPurpose)}
                              style={{
                                width: '100%',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                padding: '10px',
                                color: '#f1f5f9',
                                fontSize: '13px',
                                outline: 'none'
                              }}
                            >
                              <option value="Consultation">Consultation</option>
                              <option value="Emergency">Emergency</option>
                              <option value="Prescription Refill">Prescription Refill</option>
                              <option value="Insurance Claim">Insurance Claim</option>
                              <option value="Lab Review">Lab Review</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Data Scope *</label>
                            <select
                              value={requestScope}
                              onChange={(e) => setRequestScope(e.target.value as ConsentScope)}
                              style={{
                                width: '100%',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                padding: '10px',
                                color: '#f1f5f9',
                                fontSize: '13px',
                                outline: 'none'
                              }}
                            >
                              <option value="Prescriptions Only">Prescriptions Only</option>
                              <option value="Lab Reports Only">Lab Reports Only</option>
                              <option value="Full Medical History">Full Medical History</option>
                              <option value="Allergies Only">Allergies Only</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Duration *</label>
                            <select
                              value={requestDuration}
                              onChange={(e) => setRequestDuration(e.target.value as ConsentDuration)}
                              style={{
                                width: '100%',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                padding: '10px',
                                color: '#f1f5f9',
                                fontSize: '13px',
                                outline: 'none'
                              }}
                            >
                              <option value="1 Hour">1 Hour</option>
                              <option value="24 Hours">24 Hours</option>
                              <option value="7 Days">7 Days</option>
                              <option value="One-Time">One-Time</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Message (Optional)</label>
                          <textarea
                            value={requestMessage}
                            onChange={(e) => setRequestMessage(e.target.value)}
                            placeholder="Reason for requesting data (optional)"
                            rows={3}
                            style={{
                              width: '100%',
                              background: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              color: '#f1f5f9',
                              fontSize: '13px',
                              outline: 'none',
                              resize: 'vertical'
                            }}
                          />
                        </div>

                        <button
                          onClick={handleSendRequest}
                          style={{
                            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '12px 24px',
                            fontWeight: 600,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            width: '100%',
                            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.2)'
                          }}
                        >
                          Submit Access Request
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {searchError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  color: '#fca5a5',
                  fontSize: '13px',
                  marginTop: '8px'
                }}
              >
                <AlertCircle className="w-4 h-4" />
                {searchError}
              </div>
            )}
          </div>
        </Card>

        {/* Stats Grid */}
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
            value={vaults.length}
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
            value={activeConsentsCount}
            color="cyan"
            id="stat-active-consents"
          />
        </div>

        {/* Content Columns */}
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
              {vaults.map(vault => {
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
                  const vault = vaults.find(v => v.patientId === req.patientId)
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

