/* ============================================
   PrescriptionNet — Type Definitions
   ============================================ */

export type UserRole = 'patient' | 'doctor' | 'requester'
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE'
export type ConsentStatus = 'pending' | 'active' | 'expired' | 'revoked'
export type ConsentPurpose = 'Consultation' | 'Emergency' | 'Prescription Refill' | 'Insurance Claim' | 'Lab Review'
export type ConsentScope = 'Prescriptions Only' | 'Lab Reports Only' | 'Full Medical History' | 'Allergies Only'
export type ConsentDuration = '1 Hour' | '24 Hours' | '7 Days' | 'One-Time'

export interface User {
  id: string
  name: string
  role: UserRole
  email: string
  publicKey: string
  createdAt: string
}

export interface Prescription {
  id: string
  patientId: string
  drugName: string
  dosage: string
  frequency: string
  prescribedBy: string
  prescribedDate: string
  expiryDate: string
  isActive: boolean
}

export interface LabReport {
  id: string
  patientId: string
  testName: string
  result: string
  referenceRange: string
  isAbnormal: boolean
  conductedDate: string
  conductedBy: string
}

export interface PatientVault {
  patientId: string
  patientName: string
  dateOfBirth: string
  bloodGroup: string
  allergies: string[]
  conditions: string[]
  prescriptions: Prescription[]
  labReports: LabReport[]
  medicationHistory: string[]
  emergencyAccessEnabled: boolean
}

export interface AccessRequest {
  id: string
  requesterId: string
  requesterName: string
  requesterRole: string
  patientId: string
  purpose: ConsentPurpose
  scope: ConsentScope
  duration: ConsentDuration
  status: ConsentStatus
  requestedAt: string
  message?: string
}

export interface Consent {
  id: string
  requestId: string
  patientId: string
  requesterId: string
  scope: ConsentScope
  purpose: ConsentPurpose
  duration: ConsentDuration
  status: ConsentStatus
  grantedAt: string
  expiresAt: string
  patientSignature: string
  sessionKeyEncrypted: string
}

export interface LedgerEntry {
  index: number
  eventType: string
  patientId: string
  requesterId: string
  consentScope: string
  timestamp: string
  transactionHash: string
  previousHash: string
}

export interface DrugInteraction {
  drugs: string[]
  severity: RiskLevel
  explanation: string
}

export interface SafetyAnalysis {
  drugInteractions: DrugInteraction[]
  duplicateMedications: { drug: string; explanation: string }[]
  allergyConflicts: { drug: string; allergy: string; explanation: string }[]
  medicationSafetyRisks: { risk: string; explanation: string }[]
  overallRiskLevel: RiskLevel
  disclaimer: string
}

export interface FraudFlag {
  type: string
  explanation: string
  severity: RiskLevel
  detectedBy: 'rule' | 'ai'
}

export interface FraudAnalysis {
  fraudRiskScore: number
  flags: FraudFlag[]
  summary: string
  disclaimer: string
}

export interface AuditEntry {
  id: string
  consentId: string
  patientId: string
  requesterId: string
  action: 'requested' | 'approved' | 'denied' | 'viewed' | 'revoked' | 'expired'
  dataAccessed?: string
  timestamp: string
}

export interface SecureSession {
  sessionId: string
  consentId: string
  requesterId: string
  patientId: string
  encryptedSessionKey: string
  encryptedPayload?: string
  expiresAt: string
  isActive: boolean
  createdAt: string
}

export interface AuditEntry {
  id: string
  consentId: string
  patientId: string
  requesterId: string
  action: 'requested' | 'approved' | 'denied' | 'viewed' | 'revoked' | 'expired'
  dataAccessed?: string
  timestamp: string
}

export interface SecureSession {
  sessionId: string
  consentId: string
  requesterId: string
  patientId: string
  encryptedSessionKey: string
  encryptedPayload?: string
  expiresAt: string
  isActive: boolean
  createdAt: string
}
