import type {
  AccessRequest,
  Consent,
  FraudAnalysis,
  PatientVault,
  Prescription,
  RiskLevel,
  SafetyAnalysis,
  User,
} from '@/types'
import { generateTransactionHash } from './ledger'

export const MOCK_USERS: User[] = [
  { id: 'patient-001', name: 'Priya Sharma', role: 'patient', email: 'priya@email.com', publicKey: '', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'patient-002', name: 'Rajesh Kumar', role: 'patient', email: 'rajesh@email.com', publicKey: '', createdAt: '2024-01-10T09:00:00Z' },
  { id: 'patient-003', name: 'Ananya Singh', role: 'patient', email: 'ananya@email.com', publicKey: '', createdAt: '2024-02-01T11:00:00Z' },
  { id: 'doctor-001', name: 'Dr. Arvind Mehta', role: 'doctor', email: 'arvind@hospital.com', publicKey: '', createdAt: '2023-06-01T08:00:00Z' },
  { id: 'doctor-002', name: 'Dr. Sunita Rao', role: 'doctor', email: 'sunita@clinic.com', publicKey: '', createdAt: '2023-05-15T08:00:00Z' },
  { id: 'requester-001', name: 'Apollo Pharmacy', role: 'requester', email: 'records@apollo.com', publicKey: '', createdAt: '2023-01-01T08:00:00Z' },
  { id: 'requester-002', name: 'Star Health Insurance', role: 'requester', email: 'claims@starhealth.com', publicKey: '', createdAt: '2023-01-01T08:00:00Z' },
]

function withUpdatedAt(vault: PatientVault): PatientVault & { updatedAt: string } {
  return {
    ...vault,
    updatedAt: '2024-11-15T12:00:00.000Z',
  }
}

export const VAULT_PRIYA = withUpdatedAt({
  patientId: 'patient-001',
  patientName: 'Priya Sharma',
  dateOfBirth: '1990-03-22',
  bloodGroup: 'B+',
  allergies: ['Penicillin', 'Sulfa drugs'],
  conditions: ['Type 2 Diabetes', 'Hypertension'],
  medicationHistory: ['Glibenclamide 5mg (2019-2021) - Discontinued', 'Amlodipine 5mg (2020-2022) - Switched'],
  prescriptions: [
    { id: 'rx-p1-001', patientId: 'patient-001', drugName: 'Metformin', dosage: '500mg', frequency: 'Twice daily with meals', prescribedBy: 'Dr. Arvind Mehta', prescribedDate: '2024-11-01', expiryDate: '2025-05-01', isActive: true },
    { id: 'rx-p1-002', patientId: 'patient-001', drugName: 'Lisinopril', dosage: '10mg', frequency: 'Once daily morning', prescribedBy: 'Dr. Arvind Mehta', prescribedDate: '2024-11-01', expiryDate: '2025-05-01', isActive: true },
    { id: 'rx-p1-003', patientId: 'patient-001', drugName: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily bedtime', prescribedBy: 'Dr. Sunita Rao', prescribedDate: '2024-10-15', expiryDate: '2025-04-15', isActive: true },
  ],
  labReports: [
    { id: 'lab-p1-001', patientId: 'patient-001', testName: 'HbA1c', result: '7.8%', referenceRange: 'Below 7.0%', isAbnormal: true, conductedDate: '2024-11-10', conductedBy: 'Metropolis Labs' },
    { id: 'lab-p1-002', patientId: 'patient-001', testName: 'Blood Pressure', result: '138/88 mmHg', referenceRange: 'Below 120/80 mmHg', isAbnormal: true, conductedDate: '2024-11-10', conductedBy: 'Apollo Diagnostics' },
  ],
  emergencyAccessEnabled: false,
})

export const VAULT_RAJESH = withUpdatedAt({
  patientId: 'patient-002',
  patientName: 'Rajesh Kumar',
  dateOfBirth: '1966-07-14',
  bloodGroup: 'O+',
  allergies: ['NSAIDs', 'Ibuprofen'],
  conditions: ['Atrial Fibrillation', 'Heart Failure', 'Hypertension'],
  medicationHistory: ['Aspirin 75mg by Dr. Mehta (2024-09-01)', 'Aspirin 150mg by Dr. Rao (2024-10-15) - DUPLICATE'],
  prescriptions: [
    { id: 'rx-p2-001', patientId: 'patient-002', drugName: 'Warfarin', dosage: '5mg', frequency: 'Once daily', prescribedBy: 'Dr. Arvind Mehta', prescribedDate: '2024-10-01', expiryDate: '2025-04-01', isActive: true },
    { id: 'rx-p2-002', patientId: 'patient-002', drugName: 'Digoxin', dosage: '0.25mg', frequency: 'Once daily', prescribedBy: 'Dr. Arvind Mehta', prescribedDate: '2024-10-01', expiryDate: '2025-04-01', isActive: true },
    { id: 'rx-p2-003', patientId: 'patient-002', drugName: 'Aspirin', dosage: '75mg', frequency: 'Once daily', prescribedBy: 'Dr. Arvind Mehta', prescribedDate: '2024-09-01', expiryDate: '2025-03-01', isActive: true },
    { id: 'rx-p2-004', patientId: 'patient-002', drugName: 'Aspirin', dosage: '150mg', frequency: 'Once daily', prescribedBy: 'Dr. Sunita Rao', prescribedDate: '2024-10-15', expiryDate: '2025-04-15', isActive: true },
    { id: 'rx-p2-005', patientId: 'patient-002', drugName: 'Carvedilol', dosage: '6.25mg', frequency: 'Twice daily with food', prescribedBy: 'Dr. Sunita Rao', prescribedDate: '2024-11-01', expiryDate: '2025-05-01', isActive: true },
  ],
  labReports: [
    { id: 'lab-p2-001', patientId: 'patient-002', testName: 'INR', result: '3.8', referenceRange: '2.0-3.0', isAbnormal: true, conductedDate: '2024-11-12', conductedBy: 'Metropolis Labs' },
    { id: 'lab-p2-002', patientId: 'patient-002', testName: 'BNP', result: '820 pg/mL', referenceRange: 'Below 100 pg/mL', isAbnormal: true, conductedDate: '2024-11-12', conductedBy: 'Apollo Diagnostics' },
    { id: 'lab-p2-003', patientId: 'patient-002', testName: 'Serum Digoxin Level', result: '2.4 ng/mL', referenceRange: '0.5-2.0 ng/mL', isAbnormal: true, conductedDate: '2024-11-08', conductedBy: 'SRL Diagnostics' },
  ],
  emergencyAccessEnabled: false,
})

export const VAULT_ANANYA = withUpdatedAt({
  patientId: 'patient-003',
  patientName: 'Ananya Singh',
  dateOfBirth: '1996-11-05',
  bloodGroup: 'A+',
  allergies: [],
  conditions: ['Major Depressive Disorder', 'Generalised Anxiety Disorder'],
  medicationHistory: ['Tramadol 50mg - 3 prescriptions in 30 days from different doctors'],
  prescriptions: [
    { id: 'rx-p3-001', patientId: 'patient-003', drugName: 'Sertraline', dosage: '50mg', frequency: 'Once daily morning', prescribedBy: 'Dr. Sunita Rao', prescribedDate: '2024-10-01', expiryDate: '2025-04-01', isActive: true },
    { id: 'rx-p3-002', patientId: 'patient-003', drugName: 'Alprazolam', dosage: '0.5mg', frequency: 'Twice daily', prescribedBy: 'Dr. Sunita Rao', prescribedDate: '2024-10-01', expiryDate: '2024-12-01', isActive: true },
    { id: 'rx-p3-003', patientId: 'patient-003', drugName: 'Tramadol', dosage: '50mg', frequency: 'As needed', prescribedBy: 'Dr. Arvind Mehta', prescribedDate: '2024-10-20', expiryDate: '2024-11-20', isActive: true },
    { id: 'rx-p3-004', patientId: 'patient-003', drugName: 'Tramadol', dosage: '50mg', frequency: 'As needed', prescribedBy: 'Dr. Sunita Rao', prescribedDate: '2024-11-01', expiryDate: '2024-12-01', isActive: true },
    { id: 'rx-p3-005', patientId: 'patient-003', drugName: 'Tramadol', dosage: '100mg', frequency: 'Twice daily', prescribedBy: 'Dr. Ramesh Gupta', prescribedDate: '2024-11-10', expiryDate: '2024-12-10', isActive: true },
  ],
  labReports: [
    { id: 'lab-p3-001', patientId: 'patient-003', testName: 'Liver Function Test', result: '28 U/L', referenceRange: '7-40 U/L', isAbnormal: false, conductedDate: '2024-11-05', conductedBy: 'Metropolis Labs' },
  ],
  emergencyAccessEnabled: false,
})

export const ALL_VAULTS: PatientVault[] = [VAULT_PRIYA, VAULT_RAJESH, VAULT_ANANYA]

export const MOCK_ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: 'req-demo-001',
    requesterId: 'doctor-001',
    requesterName: 'Dr. Arvind Mehta',
    requesterRole: 'doctor',
    patientId: 'patient-001',
    purpose: 'Consultation',
    scope: 'Prescriptions Only',
    duration: '24 Hours',
    status: 'pending',
    requestedAt: '2024-11-15T09:00:00.000Z',
    message: 'Reviewing medication plan before next consultation',
  },
  {
    id: 'req-demo-002',
    requesterId: 'requester-001',
    requesterName: 'Apollo Pharmacy',
    requesterRole: 'requester',
    patientId: 'patient-002',
    purpose: 'Prescription Refill',
    scope: 'Prescriptions Only',
    duration: '1 Hour',
    status: 'pending',
    requestedAt: '2024-11-15T09:30:00.000Z',
    message: 'Processing prescription refill request',
  },
]

export const MOCK_CONSENTS: Consent[] = []

export const MOCK_LEDGER = [
  {
    index: 0,
    eventType: 'SYSTEM_INITIALIZED',
    patientId: 'system',
    requesterId: 'system',
    consentScope: 'N/A',
    timestamp: '2024-11-15T00:00:00.000Z',
    transactionHash: '0xb003cc8f1935d43e83bcb50fd45b7357e2388ce0095cb996db8b2dc2a0583941',
    previousHash: '0x0000000000000000',
  },
  {
    index: 1,
    eventType: 'ACCESS_REQUESTED',
    patientId: 'patient-001',
    requesterId: 'doctor-001',
    consentScope: 'Prescriptions Only',
    timestamp: '2024-11-15T08:15:00.000Z',
    transactionHash: '0xf912875174d15646228526ea6d7fd2dc4128936f868903c9d1474b6f781057ff',
    previousHash: '0xb003cc8f1935d43e83bcb50fd45b7357e2388ce0095cb996db8b2dc2a0583941',
  },
  {
    index: 2,
    eventType: 'ACCESS_REQUESTED',
    patientId: 'patient-002',
    requesterId: 'requester-001',
    consentScope: 'Prescriptions Only',
    timestamp: '2024-11-15T08:30:00.000Z',
    transactionHash: '0xad52e3a9bd658a1e5e560d5d5df731210e8cdeea380a9e945d45a144241c9ea7',
    previousHash: '0xf912875174d15646228526ea6d7fd2dc4128936f868903c9d1474b6f781057ff',
  },
]

export const MOCK_SAFETY_PRIYA: SafetyAnalysis = {
  drugInteractions: [],
  duplicateMedications: [],
  allergyConflicts: [],
  medicationSafetyRisks: [],
  overallRiskLevel: 'SAFE',
  disclaimer: 'This analysis is AI-generated for decision support only. Clinical judgment must guide all treatment decisions.',
}

export const MOCK_SAFETY_RAJESH: SafetyAnalysis = {
  drugInteractions: [
    { drugs: ['Warfarin', 'Aspirin'], severity: 'HIGH', explanation: 'Concurrent use significantly increases bleeding risk. INR is already elevated at 3.8.' },
    { drugs: ['Digoxin', 'Carvedilol'], severity: 'MEDIUM', explanation: 'Carvedilol may increase digoxin levels. Serum digoxin is already elevated at 2.4 ng/mL.' },
  ],
  duplicateMedications: [
    { drug: 'Aspirin', explanation: 'Two active prescriptions: 75mg and 150mg from different prescribers.' },
  ],
  allergyConflicts: [],
  medicationSafetyRisks: [
    { risk: 'Elevated INR (3.8) while on anticoagulant + antiplatelet therapy', explanation: 'INR above therapeutic range with concurrent Warfarin and Aspirin use increases hemorrhage risk.' },
    { risk: 'Digoxin toxicity risk', explanation: 'Serum digoxin level (2.4 ng/mL) exceeds therapeutic range (0.5-2.0 ng/mL).' },
  ],
  overallRiskLevel: 'HIGH',
  disclaimer: 'This analysis is AI-generated for decision support only. Clinical judgment must guide all treatment decisions.',
}

export const MOCK_SAFETY_ANANYA: SafetyAnalysis = {
  drugInteractions: [
    { drugs: ['Sertraline', 'Tramadol'], severity: 'HIGH', explanation: 'Risk of serotonin syndrome. Both drugs increase serotonergic activity.' },
  ],
  duplicateMedications: [
    { drug: 'Tramadol', explanation: 'Three active prescriptions from three different doctors within 30 days.' },
  ],
  allergyConflicts: [],
  medicationSafetyRisks: [
    { risk: 'Benzodiazepine + Opioid combination', explanation: 'Alprazolam with Tramadol increases risk of respiratory depression, sedation, and overdose.' },
  ],
  overallRiskLevel: 'HIGH',
  disclaimer: 'This analysis is AI-generated for decision support only. Clinical judgment must guide all treatment decisions.',
}

export const MOCK_FRAUD_PRIYA: FraudAnalysis = {
  fraudRiskScore: 5,
  flags: [],
  summary: 'No fraud indicators detected. Prescription pattern is consistent and within normal parameters.',
  disclaimer: 'This is an automated screening. All flags must be reviewed by authorized personnel before any action is taken.',
}

export const MOCK_FRAUD_RAJESH: FraudAnalysis = {
  fraudRiskScore: 45,
  flags: [
    { type: 'Duplicate Prescription', explanation: 'Aspirin prescribed by two different doctors at different dosages.', severity: 'MEDIUM', detectedBy: 'rule' },
  ],
  summary: 'Moderate risk. Duplicate prescription detected but may be a coordination gap between prescribers rather than intentional fraud.',
  disclaimer: 'This is an automated screening. All flags must be reviewed by authorized personnel before any action is taken.',
}

export const MOCK_FRAUD_ANANYA: FraudAnalysis = {
  fraudRiskScore: 82,
  flags: [
    { type: 'Doctor Shopping', explanation: '3 prescriptions for Tramadol from 3 different prescribers within 30 days.', severity: 'HIGH', detectedBy: 'rule' },
    { type: 'Dose Escalation', explanation: 'Tramadol dosage escalated from 50mg to 100mg across prescribers.', severity: 'MEDIUM', detectedBy: 'ai' },
    { type: 'Controlled Substance Pattern', explanation: 'Multiple controlled substances prescribed concurrently.', severity: 'HIGH', detectedBy: 'rule' },
  ],
  summary: 'High fraud risk detected. Pattern consistent with prescription drug abuse or doctor-shopping behavior for controlled substances.',
  disclaimer: 'This is an automated screening. All flags must be reviewed by authorized personnel before any action is taken.',
}

export function getAllUsers(): User[] {
  if (typeof window === 'undefined') return MOCK_USERS
  try {
    const raw = localStorage.getItem('users')
    return raw ? (JSON.parse(raw) as User[]) : MOCK_USERS
  } catch {
    return MOCK_USERS
  }
}

export function getUserById(id: string): User | null {
  return getAllUsers().find((user) => user.id === id) ?? null
}

export function getPatients(): User[] {
  return getAllUsers().filter((user) => user.role === 'patient')
}

export function getDoctors(): User[] {
  return getAllUsers().filter((user) => user.role === 'doctor')
}

export function getAllVaults(): PatientVault[] {
  if (typeof window === 'undefined') return ALL_VAULTS
  try {
    return ALL_VAULTS.map((vault) => {
      const raw = localStorage.getItem(`vault_${vault.patientId}`)
      return raw ? (JSON.parse(raw) as PatientVault) : vault
    })
  } catch {
    return ALL_VAULTS
  }
}

export function getVaultByPatientId(patientId: string): PatientVault | undefined {
  return ALL_VAULTS.find((vault) => vault.patientId === patientId)
}

export function getSafetyByPatientId(patientId: string): SafetyAnalysis {
  switch (patientId) {
    case 'patient-002':
      return MOCK_SAFETY_RAJESH
    case 'patient-003':
      return MOCK_SAFETY_ANANYA
    default:
      return MOCK_SAFETY_PRIYA
  }
}

export function getFraudByPatientId(patientId: string): FraudAnalysis {
  switch (patientId) {
    case 'patient-002':
      return MOCK_FRAUD_RAJESH
    case 'patient-003':
      return MOCK_FRAUD_ANANYA
    default:
      return MOCK_FRAUD_PRIYA
  }
}

function setStorageItem(storageKey: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    // Ignore storage failures.
  }
}

async function buildLedgerEntries() {
  const genesisBase = {
    eventType: 'SYSTEM_INITIALIZED',
    patientId: 'system',
    requesterId: 'system',
    consentScope: 'N/A',
    timestamp: '2024-11-15T00:00:00.000Z',
  }
  const secondBase = {
    eventType: 'ACCESS_REQUESTED',
    patientId: 'patient-001',
    requesterId: 'doctor-001',
    consentScope: 'Prescriptions Only',
    timestamp: '2024-11-15T08:15:00.000Z',
  }
  const thirdBase = {
    eventType: 'ACCESS_REQUESTED',
    patientId: 'patient-002',
    requesterId: 'requester-001',
    consentScope: 'Prescriptions Only',
    timestamp: '2024-11-15T08:30:00.000Z',
  }

  const genesisHash = await generateTransactionHash(genesisBase)
  const secondHash = await generateTransactionHash(secondBase)
  const thirdHash = await generateTransactionHash(thirdBase)

  return [
    { index: 0, ...genesisBase, transactionHash: genesisHash, previousHash: '0x0000000000000000' },
    { index: 1, ...secondBase, transactionHash: secondHash, previousHash: genesisHash },
    { index: 2, ...thirdBase, transactionHash: thirdHash, previousHash: secondHash },
  ]
}

export async function initializeMockData(): Promise<void> {
  if (typeof window === 'undefined') return

  setStorageItem('users', MOCK_USERS)
  setStorageItem('vault_patient-001', withUpdatedAt(VAULT_PRIYA))
  setStorageItem('vault_patient-002', withUpdatedAt(VAULT_RAJESH))
  setStorageItem('vault_patient-003', withUpdatedAt(VAULT_ANANYA))
  setStorageItem('accessRequests', MOCK_ACCESS_REQUESTS)
  setStorageItem('consents', MOCK_CONSENTS)
  setStorageItem('auditLog', [
    {
      id: 'audit-demo-001',
      consentId: 'audit-demo-consent-001',
      patientId: 'patient-001',
      requesterId: 'doctor-001',
      action: 'requested',
      dataAccessed: 'Consultation / Prescriptions Only / 24 Hours',
      timestamp: '2024-11-15T09:00:00.000Z',
    },
    {
      id: 'audit-demo-002',
      consentId: 'audit-demo-consent-001',
      patientId: 'patient-001',
      requesterId: 'doctor-001',
      action: 'viewed',
      dataAccessed: 'Active prescription summary',
      timestamp: '2024-11-15T09:10:00.000Z',
    },
  ])
  setStorageItem('ledger', await buildLedgerEntries())
  setStorageItem('aiAnalysesToday', 0)
  setStorageItem('fraudAlertsToday', 0)
  setStorageItem('mockDataInitialized', true)
}

export async function resetMockData(): Promise<void> {
  if (typeof window === 'undefined') return

  const keys = [
    'mockDataInitialized',
    'users',
    'accessRequests',
    'consents',
    'auditLog',
    'ledger',
    'aiAnalysesToday',
    'aiAnalysesCount',
    'fraudAlertsToday',
    'currentUser',
    'sessionData',
    'currentSession',
  ]

  for (const vault of ALL_VAULTS) {
    keys.push(`vault_${vault.patientId}`)
  }

  for (const user of MOCK_USERS) {
    keys.push(`keypair_${user.id}`)
  }

  for (const key of keys) {
    localStorage.removeItem(key)
  }

  await initializeMockData()
}

export function getVaultFromStorage(patientId: string): PatientVault | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`vault_${patientId}`)
    return raw ? (JSON.parse(raw) as PatientVault) : null
  } catch {
    return null
  }
}

export { type RiskLevel }
