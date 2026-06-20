/* ============================================
   PrescriptionNet — Mock Data
   ============================================ */

import { User, PatientVault, AccessRequest, Consent, LedgerEntry, SafetyAnalysis, FraudAnalysis } from '@/types'

// ---- Users ----
export const MOCK_USERS: User[] = [
  { id: "patient-001", name: "Priya Sharma", role: "patient", email: "priya@email.com", publicKey: "", createdAt: "2024-01-15T10:00:00Z" },
  { id: "patient-002", name: "Rajesh Kumar", role: "patient", email: "rajesh@email.com", publicKey: "", createdAt: "2024-01-10T09:00:00Z" },
  { id: "patient-003", name: "Ananya Singh", role: "patient", email: "ananya@email.com", publicKey: "", createdAt: "2024-02-01T11:00:00Z" },
  { id: "doctor-001", name: "Dr. Arvind Mehta", role: "doctor", email: "arvind@hospital.com", publicKey: "", createdAt: "2023-06-01T08:00:00Z" },
  { id: "doctor-002", name: "Dr. Sunita Rao", role: "doctor", email: "sunita@clinic.com", publicKey: "", createdAt: "2023-05-15T08:00:00Z" },
  { id: "requester-001", name: "Apollo Pharmacy", role: "requester", email: "records@apollo.com", publicKey: "", createdAt: "2023-01-01T08:00:00Z" },
  { id: "requester-002", name: "Star Health Insurance", role: "requester", email: "claims@starhealth.com", publicKey: "", createdAt: "2023-01-01T08:00:00Z" }
]

// ---- Patient Vaults ----
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

export const ALL_VAULTS: PatientVault[] = [VAULT_PRIYA, VAULT_RAJESH, VAULT_ANANYA]

// ---- Access Requests ----
export const MOCK_ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: "ar-001", requesterId: "requester-001", requesterName: "Apollo Pharmacy", requesterRole: "requester",
    patientId: "patient-001", purpose: "Prescription Refill", scope: "Prescriptions Only",
    duration: "24 Hours", status: "pending", requestedAt: "2024-11-15T09:00:00Z",
    message: "Patient requested prescription refill for Metformin 500mg."
  },
  {
    id: "ar-002", requesterId: "doctor-002", requesterName: "Dr. Sunita Rao", requesterRole: "doctor",
    patientId: "patient-001", purpose: "Consultation", scope: "Full Medical History",
    duration: "7 Days", status: "pending", requestedAt: "2024-11-15T10:30:00Z",
    message: "Need full history for upcoming cardiology consultation."
  },
  {
    id: "ar-003", requesterId: "requester-002", requesterName: "Star Health Insurance", requesterRole: "requester",
    patientId: "patient-002", purpose: "Insurance Claim", scope: "Full Medical History",
    duration: "7 Days", status: "pending", requestedAt: "2024-11-14T14:00:00Z",
    message: "Insurance claim verification for policy renewal."
  },
  {
    id: "ar-004", requesterId: "doctor-001", requesterName: "Dr. Arvind Mehta", requesterRole: "doctor",
    patientId: "patient-003", purpose: "Lab Review", scope: "Lab Reports Only",
    duration: "24 Hours", status: "active", requestedAt: "2024-11-13T08:00:00Z"
  }
]

// ---- Consents ----
export const MOCK_CONSENTS: Consent[] = [
  {
    id: "consent-001", requestId: "ar-004", patientId: "patient-003", requesterId: "doctor-001",
    scope: "Lab Reports Only", purpose: "Lab Review", duration: "24 Hours", status: "active",
    grantedAt: "2024-11-13T08:30:00Z",
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    patientSignature: "sig_ananya_ecdsa_v1_abc123", sessionKeyEncrypted: "enc_session_xyz"
  }
]

// ---- Ledger Entries ----
export const MOCK_LEDGER: LedgerEntry[] = [
  {
    index: 0, eventType: "CONSENT_GRANTED", patientId: "patient-003", requesterId: "doctor-001",
    consentScope: "Lab Reports Only", timestamp: "2024-11-13T08:30:00Z",
    transactionHash: "0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    previousHash: "0x0000000000000000000000000000000000000000000000000000000000000000"
  },
  {
    index: 1, eventType: "DATA_ACCESSED", patientId: "patient-003", requesterId: "doctor-001",
    consentScope: "Lab Reports Only", timestamp: "2024-11-13T09:15:00Z",
    transactionHash: "0xf6e5d4c3b2a19087654321098765432109876543210fedcba9876543210fedcba",
    previousHash: "0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
  },
  {
    index: 2, eventType: "CONSENT_GRANTED", patientId: "patient-001", requesterId: "doctor-002",
    consentScope: "Prescriptions Only", timestamp: "2024-11-12T14:00:00Z",
    transactionHash: "0x1234abcd5678ef901234abcd5678ef901234abcd5678ef901234abcd5678ef90",
    previousHash: "0xf6e5d4c3b2a19087654321098765432109876543210fedcba9876543210fedcba"
  },
  {
    index: 3, eventType: "CONSENT_REVOKED", patientId: "patient-001", requesterId: "doctor-002",
    consentScope: "Prescriptions Only", timestamp: "2024-11-12T18:00:00Z",
    transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    previousHash: "0x1234abcd5678ef901234abcd5678ef901234abcd5678ef901234abcd5678ef90"
  },
  {
    index: 4, eventType: "EMERGENCY_ACCESS", patientId: "patient-002", requesterId: "doctor-001",
    consentScope: "Full Medical History", timestamp: "2024-11-10T03:20:00Z",
    transactionHash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
    previousHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  }
]

// ---- Safety Analysis (Rajesh — high risk) ----
export const MOCK_SAFETY_RAJESH: SafetyAnalysis = {
  drugInteractions: [
    { drugs: ["Warfarin", "Aspirin"], severity: "HIGH", explanation: "Concurrent use significantly increases bleeding risk. INR is already elevated at 3.8." },
    { drugs: ["Digoxin", "Carvedilol"], severity: "MEDIUM", explanation: "Carvedilol may increase digoxin levels. Serum digoxin is already elevated at 2.4 ng/mL." }
  ],
  duplicateMedications: [
    { drug: "Aspirin", explanation: "Two active prescriptions: 75mg by Dr. Mehta and 150mg by Dr. Rao. Different dosages from different prescribers." }
  ],
  allergyConflicts: [],
  medicationSafetyRisks: [
    { risk: "Elevated INR (3.8) while on anticoagulant + antiplatelet therapy", explanation: "INR above therapeutic range with concurrent Warfarin and Aspirin use increases hemorrhage risk." },
    { risk: "Digoxin toxicity risk", explanation: "Serum digoxin level (2.4 ng/mL) exceeds therapeutic range (0.5-2.0 ng/mL)." }
  ],
  overallRiskLevel: "HIGH",
  disclaimer: "This analysis is AI-generated for decision support only. Clinical judgment must guide all treatment decisions."
}

// ---- Safety Analysis (Priya — safe) ----
export const MOCK_SAFETY_PRIYA: SafetyAnalysis = {
  drugInteractions: [],
  duplicateMedications: [],
  allergyConflicts: [],
  medicationSafetyRisks: [],
  overallRiskLevel: "SAFE",
  disclaimer: "This analysis is AI-generated for decision support only. Clinical judgment must guide all treatment decisions."
}

// ---- Safety Analysis (Ananya — medium) ----
export const MOCK_SAFETY_ANANYA: SafetyAnalysis = {
  drugInteractions: [
    { drugs: ["Sertraline", "Tramadol"], severity: "HIGH", explanation: "Risk of serotonin syndrome. Both drugs increase serotonergic activity." }
  ],
  duplicateMedications: [
    { drug: "Tramadol", explanation: "Three active prescriptions from three different doctors within 30 days. Possible doctor-shopping behavior." }
  ],
  allergyConflicts: [],
  medicationSafetyRisks: [
    { risk: "Benzodiazepine + Opioid combination", explanation: "Alprazolam with Tramadol increases risk of respiratory depression, sedation, and overdose." }
  ],
  overallRiskLevel: "HIGH",
  disclaimer: "This analysis is AI-generated for decision support only. Clinical judgment must guide all treatment decisions."
}

// ---- Fraud Analysis (Ananya — high risk) ----
export const MOCK_FRAUD_ANANYA: FraudAnalysis = {
  fraudRiskScore: 82,
  flags: [
    { type: "Doctor Shopping", explanation: "3 prescriptions for Tramadol from 3 different prescribers within 30 days.", severity: "HIGH", detectedBy: "rule" },
    { type: "Dose Escalation", explanation: "Tramadol dosage escalated from 50mg to 100mg across prescribers.", severity: "MEDIUM", detectedBy: "ai" },
    { type: "Controlled Substance Pattern", explanation: "Multiple controlled substances (Alprazolam + Tramadol) prescribed concurrently.", severity: "HIGH", detectedBy: "rule" }
  ],
  summary: "High fraud risk detected. Pattern consistent with prescription drug abuse or doctor-shopping behavior for controlled substances.",
  disclaimer: "This is an automated screening. All flags must be reviewed by authorized personnel before any action is taken."
}

// ---- Fraud Analysis (Rajesh — medium risk) ----
export const MOCK_FRAUD_RAJESH: FraudAnalysis = {
  fraudRiskScore: 45,
  flags: [
    { type: "Duplicate Prescription", explanation: "Aspirin prescribed by two different doctors at different dosages.", severity: "MEDIUM", detectedBy: "rule" }
  ],
  summary: "Moderate risk. Duplicate prescription detected but may be a coordination gap between prescribers rather than intentional fraud.",
  disclaimer: "This is an automated screening. All flags must be reviewed by authorized personnel before any action is taken."
}

// ---- Fraud Analysis (Priya — low risk) ----
export const MOCK_FRAUD_PRIYA: FraudAnalysis = {
  fraudRiskScore: 5,
  flags: [],
  summary: "No fraud indicators detected. Prescription pattern is consistent and within normal parameters.",
  disclaimer: "This is an automated screening. All flags must be reviewed by authorized personnel before any action is taken."
}

// ---- Helper to get vault by patient ID ----
export function getVaultByPatientId(patientId: string): PatientVault | undefined {
  return ALL_VAULTS.find(v => v.patientId === patientId)
}

// ---- Helper to get safety analysis by patient ID ----
export function getSafetyByPatientId(patientId: string): SafetyAnalysis {
  switch (patientId) {
    case 'patient-001': return MOCK_SAFETY_PRIYA
    case 'patient-002': return MOCK_SAFETY_RAJESH
    case 'patient-003': return MOCK_SAFETY_ANANYA
    default: return MOCK_SAFETY_PRIYA
  }
}

// ---- Helper to get fraud analysis by patient ID ----
export function getFraudByPatientId(patientId: string): FraudAnalysis {
  switch (patientId) {
    case 'patient-001': return MOCK_FRAUD_PRIYA
    case 'patient-002': return MOCK_FRAUD_RAJESH
    case 'patient-003': return MOCK_FRAUD_ANANYA
    default: return MOCK_FRAUD_PRIYA
  }
}
