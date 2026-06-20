import type { User, PatientVault, AccessRequest, LedgerEntry } from '@/types'

export const MOCK_USERS: User[] = [
  { id: "patient-001", name: "Priya Sharma", role: "patient", email: "priya@email.com", publicKey: "", createdAt: "2024-01-15T10:00:00Z" },
  { id: "patient-002", name: "Rajesh Kumar", role: "patient", email: "rajesh@email.com", publicKey: "", createdAt: "2024-01-10T09:00:00Z" },
  { id: "patient-003", name: "Ananya Singh", role: "patient", email: "ananya@email.com", publicKey: "", createdAt: "2024-02-01T11:00:00Z" },
  { id: "doctor-001", name: "Dr. Arvind Mehta", role: "doctor", email: "arvind@hospital.com", publicKey: "", createdAt: "2023-06-01T08:00:00Z" },
  { id: "doctor-002", name: "Dr. Sunita Rao", role: "doctor", email: "sunita@clinic.com", publicKey: "", createdAt: "2023-05-15T08:00:00Z" },
  { id: "requester-001", name: "Apollo Pharmacy", role: "requester", email: "records@apollo.com", publicKey: "", createdAt: "2023-01-01T08:00:00Z" },
  { id: "requester-002", name: "Star Health Insurance", role: "requester", email: "claims@starhealth.com", publicKey: "", createdAt: "2023-01-01T08:00:00Z" }
]

export const VAULT_PRIYA: PatientVault = {
  patientId: "patient-001", patientName: "Priya Sharma",
  dateOfBirth: "1990-03-22", bloodGroup: "B+",
  allergies: ["Penicillin", "Sulfa drugs"],
  conditions: ["Type 2 Diabetes", "Hypertension"],
  medicationHistory: ["Glibenclamide 5mg (2019-2021) - Discontinued", "Amlodipine 5mg (2020-2022) - Switched"],
  prescriptions: [
    { id: "rx-p1-001", patientId: "patient-001", drugName: "Metformin", dosage: "500mg", frequency: "Twice daily with meals", prescribedBy: "Dr. Arvind Mehta", prescribedDate: "2024-11-01", expiryDate: "2025-05-01", isActive: true },
    { id: "rx-p1-002", patientId: "patient-001", drugName: "Lisinopril", dosage: "10mg", frequency: "Once daily morning", prescribedBy: "Dr. Arvind Mehta", prescribedDate: "2024-11-01", expiryDate: "2025-05-01", isActive: true },
    { id: "rx-p1-003", patientId: "patient-001", drugName: "Atorvastatin", dosage: "20mg", frequency: "Once daily bedtime", prescribedBy: "Dr. Sunita Rao", prescribedDate: "2024-10-15", expiryDate: "2025-04-15", isActive: true }
  ],
  labReports: [
    { id: "lab-p1-001", patientId: "patient-001", testName: "HbA1c", result: "7.8%", referenceRange: "Below 7.0%", isAbnormal: true, conductedDate: "2024-11-10", conductedBy: "Metropolis Labs" },
    { id: "lab-p1-002", patientId: "patient-001", testName: "Blood Pressure", result: "138/88 mmHg", referenceRange: "Below 120/80 mmHg", isAbnormal: true, conductedDate: "2024-11-10", conductedBy: "Apollo Diagnostics" }
  ],
  emergencyAccessEnabled: false
}

export const VAULT_RAJESH: PatientVault = {
  patientId: "patient-002", patientName: "Rajesh Kumar",
  dateOfBirth: "1966-07-14", bloodGroup: "O+",
  allergies: ["NSAIDs", "Ibuprofen"],
  conditions: ["Atrial Fibrillation", "Heart Failure", "Hypertension"],
  medicationHistory: ["Aspirin 75mg by Dr. Mehta (2024-09-01)", "Aspirin 150mg by Dr. Rao (2024-10-15) - DUPLICATE"],
  prescriptions: [
    { id: "rx-p2-001", patientId: "patient-002", drugName: "Warfarin", dosage: "5mg", frequency: "Once daily", prescribedBy: "Dr. Arvind Mehta", prescribedDate: "2024-10-01", expiryDate: "2025-04-01", isActive: true },
    { id: "rx-p2-002", patientId: "patient-002", drugName: "Digoxin", dosage: "0.25mg", frequency: "Once daily", prescribedBy: "Dr. Arvind Mehta", prescribedDate: "2024-10-01", expiryDate: "2025-04-01", isActive: true },
    { id: "rx-p2-003", patientId: "patient-002", drugName: "Aspirin", dosage: "75mg", frequency: "Once daily", prescribedBy: "Dr. Arvind Mehta", prescribedDate: "2024-09-01", expiryDate: "2025-03-01", isActive: true },
    { id: "rx-p2-004", patientId: "patient-002", drugName: "Aspirin", dosage: "150mg", frequency: "Once daily", prescribedBy: "Dr. Sunita Rao", prescribedDate: "2024-10-15", expiryDate: "2025-04-15", isActive: true },
    { id: "rx-p2-005", patientId: "patient-002", drugName: "Carvedilol", dosage: "6.25mg", frequency: "Twice daily with food", prescribedBy: "Dr. Sunita Rao", prescribedDate: "2024-11-01", expiryDate: "2025-05-01", isActive: true }
  ],
  labReports: [
    { id: "lab-p2-001", patientId: "patient-002", testName: "INR", result: "3.8", referenceRange: "2.0-3.0", isAbnormal: true, conductedDate: "2024-11-12", conductedBy: "Metropolis Labs" },
    { id: "lab-p2-002", patientId: "patient-002", testName: "BNP", result: "820 pg/mL", referenceRange: "Below 100 pg/mL", isAbnormal: true, conductedDate: "2024-11-12", conductedBy: "Apollo Diagnostics" },
    { id: "lab-p2-003", patientId: "patient-002", testName: "Serum Digoxin Level", result: "2.4 ng/mL", referenceRange: "0.5-2.0 ng/mL", isAbnormal: true, conductedDate: "2024-11-08", conductedBy: "SRL Diagnostics" }
  ],
  emergencyAccessEnabled: false
}

export const VAULT_ANANYA: PatientVault = {
  patientId: "patient-003", patientName: "Ananya Singh",
  dateOfBirth: "1996-11-05", bloodGroup: "A+",
  allergies: [],
  conditions: ["Major Depressive Disorder", "Generalised Anxiety Disorder"],
  medicationHistory: ["Tramadol 50mg - 3 prescriptions in 30 days from different doctors"],
  prescriptions: [
    { id: "rx-p3-001", patientId: "patient-003", drugName: "Sertraline", dosage: "50mg", frequency: "Once daily morning", prescribedBy: "Dr. Sunita Rao", prescribedDate: "2024-10-01", expiryDate: "2025-04-01", isActive: true },
    { id: "rx-p3-002", patientId: "patient-003", drugName: "Alprazolam", dosage: "0.5mg", frequency: "Twice daily", prescribedBy: "Dr. Sunita Rao", prescribedDate: "2024-10-01", expiryDate: "2024-12-01", isActive: true },
    { id: "rx-p3-003", patientId: "patient-003", drugName: "Tramadol", dosage: "50mg", frequency: "As needed", prescribedBy: "Dr. Arvind Mehta", prescribedDate: "2024-10-20", expiryDate: "2024-11-20", isActive: true },
    { id: "rx-p3-004", patientId: "patient-003", drugName: "Tramadol", dosage: "50mg", frequency: "As needed", prescribedBy: "Dr. Sunita Rao", prescribedDate: "2024-11-01", expiryDate: "2024-12-01", isActive: true },
    { id: "rx-p3-005", patientId: "patient-003", drugName: "Tramadol", dosage: "100mg", frequency: "Twice daily", prescribedBy: "Dr. Ramesh Gupta", prescribedDate: "2024-11-10", expiryDate: "2024-12-10", isActive: true }
  ],
  labReports: [
    { id: "lab-p3-001", patientId: "patient-003", testName: "Liver Function Test", result: "28 U/L", referenceRange: "7-40 U/L", isAbnormal: false, conductedDate: "2024-11-05", conductedBy: "Metropolis Labs" }
  ],
  emergencyAccessEnabled: false
}

export const ALL_VAULTS = [VAULT_PRIYA, VAULT_RAJESH, VAULT_ANANYA]

export const SAMPLE_REQUESTS: AccessRequest[] = [
  {
    id: "req-demo-001", requesterId: "doctor-001",
    requesterName: "Dr. Arvind Mehta", requesterRole: "doctor",
    patientId: "patient-001", purpose: "Consultation",
    scope: "Prescriptions Only", duration: "24 Hours",
    status: "pending",
    requestedAt: new Date(Date.now() - 3600000).toISOString(),
    message: "Reviewing medication plan before next consultation"
  },
  {
    id: "req-demo-002", requesterId: "requester-001",
    requesterName: "Apollo Pharmacy", requesterRole: "requester",
    patientId: "patient-002", purpose: "Prescription Refill",
    scope: "Prescriptions Only", duration: "1 Hour",
    status: "pending",
    requestedAt: new Date(Date.now() - 1800000).toISOString(),
    message: "Processing prescription refill request"
  }
]

export const SAMPLE_LEDGER: LedgerEntry[] = [
  { index: 0, eventType: "SYSTEM_INITIALIZED", patientId: "system", requesterId: "system", consentScope: "N/A", timestamp: new Date(Date.now() - 86400000).toISOString(), transactionHash: "0x3f8a9c2d1b4e7f0a", previousHash: "0x0000000000000000" },
  { index: 1, eventType: "ACCESS_REQUESTED", patientId: "patient-001", requesterId: "doctor-001", consentScope: "Prescriptions Only", timestamp: new Date(Date.now() - 3600000).toISOString(), transactionHash: "0x7c2e4a8b1d6f3e9c", previousHash: "0x3f8a9c2d1b4e7f0a" },
  { index: 2, eventType: "ACCESS_REQUESTED", patientId: "patient-002", requesterId: "requester-001", consentScope: "Prescriptions Only", timestamp: new Date(Date.now() - 1800000).toISOString(), transactionHash: "0x9d1f5b3c8e2a4710", previousHash: "0x7c2e4a8b1d6f3e9c" }
]

export function initializeMockData(): void {
  if (typeof window === 'undefined') return
  if (localStorage.getItem("mockDataInitialized") === "true") return
  localStorage.setItem("users", JSON.stringify(MOCK_USERS))
  ALL_VAULTS.forEach(vault => {
    localStorage.setItem(`vault_${vault.patientId}`, JSON.stringify(vault))
  })
  localStorage.setItem("accessRequests", JSON.stringify(SAMPLE_REQUESTS))
  localStorage.setItem("consents", JSON.stringify([]))
  localStorage.setItem("auditLog", JSON.stringify([]))
  localStorage.setItem("ledger", JSON.stringify(SAMPLE_LEDGER))
  localStorage.setItem("aiAnalysesCount", "0")
  localStorage.setItem("fraudAlertsToday", "0")
  localStorage.setItem("mockDataInitialized", "true")
}

export function resetMockData(): void {
  if (typeof window === 'undefined') return
  const keys = ["mockDataInitialized","users","accessRequests","consents","auditLog","ledger","aiAnalysesCount","fraudAlertsToday","currentUser"]
  ALL_VAULTS.forEach(v => keys.push(`vault_${v.patientId}`))
  MOCK_USERS.forEach(u => keys.push(`keypair_${u.id}`))
  keys.forEach(k => localStorage.removeItem(k))
  initializeMockData()
}

export function getAllUsers(): User[] {
  if (typeof window === 'undefined') return MOCK_USERS
  try {
    const data = localStorage.getItem("users")
    return data ? JSON.parse(data) : MOCK_USERS
  } catch { return MOCK_USERS }
}

export function getUserById(id: string): User | null {
  return getAllUsers().find(u => u.id === id) || null
}

export function getPatients(): User[] {
  return getAllUsers().filter(u => u.role === "patient")
}

export function getDoctors(): User[] {
  return getAllUsers().filter(u => u.role === "doctor")
}

export function getVaultFromStorage(patientId: string): PatientVault | null {
  if (typeof window === 'undefined') return null
  try {
    const data = localStorage.getItem(`vault_${patientId}`)
    return data ? JSON.parse(data) : null
  } catch { return null }
}
