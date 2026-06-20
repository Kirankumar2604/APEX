import type {
  ConsentScope,
  LabReport,
  PatientVault,
  Prescription,
  User,
} from '@/types'
import { getAllUsers, getVaultByPatientId } from '@/lib/mockData'
import { addLedgerEntry, LEDGER_EVENTS } from './ledger'

type StoredVault = PatientVault & {
  updatedAt?: string
  lastAccessedAt?: string
}

function cloneVault(vault: StoredVault): StoredVault {
  return {
    ...vault,
    allergies: [...vault.allergies],
    conditions: [...vault.conditions],
    prescriptions: vault.prescriptions.map((prescription) => ({ ...prescription })),
    labReports: vault.labReports.map((report) => ({ ...report })),
    medicationHistory: [...vault.medicationHistory],
  }
}

function readVault(patientId: string): StoredVault | null {
  if (typeof window === 'undefined') {
    const fallback = getVaultByPatientId(patientId)
    return fallback ? ({ ...fallback } as StoredVault) : null
  }

  try {
    const raw = localStorage.getItem(`vault_${patientId}`)
    if (raw) {
      return JSON.parse(raw) as StoredVault
    }
  } catch {
    return null
  }

  const fallback = getVaultByPatientId(patientId)
  return fallback ? ({ ...fallback } as StoredVault) : null
}

function writeVault(vault: StoredVault): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`vault_${vault.patientId}`, JSON.stringify(vault))
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

function ensureVault(patientId: string): StoredVault | null {
  const existing = readVault(patientId)
  if (existing) {
    return cloneVault(existing)
  }

  const patient = getAllUsers().find((user: User) => user.id === patientId && user.role === 'patient')
  if (!patient) {
    return null
  }

  return {
    patientId: patient.id,
    patientName: patient.name,
    dateOfBirth: '',
    bloodGroup: '',
    allergies: [],
    conditions: [],
    prescriptions: [],
    labReports: [],
    medicationHistory: [],
    emergencyAccessEnabled: false,
  }
}

export function getVault(patientId: string): PatientVault | null {
  const vault = readVault(patientId)
  return vault ? cloneVault(vault) : null
}

export function getAllVaults(): PatientVault[] {
  const patients = getAllUsers().filter((user) => user.role === 'patient')
  return patients
    .map((patient) => getVault(patient.id))
    .filter((vault): vault is PatientVault => vault !== null)
}

export function getVaultByScope(
  patientId: string,
  scope: ConsentScope
): Partial<PatientVault> | null {
  const vault = getVault(patientId)
  if (!vault) {
    return null
  }

  if (scope === 'Prescriptions Only') {
    return { patientId: vault.patientId, patientName: vault.patientName, prescriptions: vault.prescriptions }
  }

  if (scope === 'Lab Reports Only') {
    return { patientId: vault.patientId, patientName: vault.patientName, labReports: vault.labReports }
  }

  if (scope === 'Allergies Only') {
    return {
      patientId: vault.patientId,
      patientName: vault.patientName,
      allergies: vault.allergies,
      conditions: vault.conditions,
    }
  }

  return vault
}

export function saveVault(vault: PatientVault): void {
  const storedVault: StoredVault = {
    ...cloneVault(vault as StoredVault),
    updatedAt: new Date().toISOString(),
  }
  writeVault(storedVault)
}

export function updateVault(
  patientId: string,
  updates: Partial<PatientVault>
): PatientVault | null {
  const vault = ensureVault(patientId)
  if (!vault) {
    return null
  }

  const updatedVault: StoredVault = {
    ...vault,
    ...updates,
    allergies: updates.allergies ? [...updates.allergies] : [...vault.allergies],
    conditions: updates.conditions ? [...updates.conditions] : [...vault.conditions],
    prescriptions: updates.prescriptions
      ? updates.prescriptions.map((prescription) => ({ ...prescription }))
      : [...vault.prescriptions],
    labReports: updates.labReports
      ? updates.labReports.map((report) => ({ ...report }))
      : [...vault.labReports],
    medicationHistory: updates.medicationHistory ? [...updates.medicationHistory] : [...vault.medicationHistory],
    updatedAt: new Date().toISOString(),
  }

  writeVault(updatedVault)
  return cloneVault(updatedVault)
}

export function addPrescription(
  patientId: string,
  prescription: Omit<Prescription, 'id' | 'patientId'>
): Prescription {
  const vault = ensureVault(patientId)
  if (!vault) {
    throw new Error(`Patient vault not found for ${patientId}`)
  }

  const newPrescription: Prescription = {
    ...prescription,
    id: `rx-${globalThis.crypto.randomUUID()}`,
    patientId,
  }

  const nextVault: StoredVault = {
    ...vault,
    prescriptions: [...vault.prescriptions, newPrescription],
    updatedAt: new Date().toISOString(),
  }

  writeVault(nextVault)
  return newPrescription
}

export function updatePrescription(
  patientId: string,
  prescriptionId: string,
  updates: Partial<Prescription>
): void {
  const vault = ensureVault(patientId)
  if (!vault) {
    return
  }

  const updatedPrescriptions = vault.prescriptions.map((prescription) =>
    prescription.id === prescriptionId ? { ...prescription, ...updates } : prescription
  )

  writeVault({
    ...vault,
    prescriptions: updatedPrescriptions,
    updatedAt: new Date().toISOString(),
  })
}

export function deactivatePrescription(
  patientId: string,
  prescriptionId: string
): void {
  updatePrescription(patientId, prescriptionId, { isActive: false })
}

export function getActivePrescriptions(
  patientId: string
): Prescription[] {
  const vault = getVault(patientId)
  return vault ? vault.prescriptions.filter((prescription) => prescription.isActive) : []
}

export function addLabReport(
  patientId: string,
  report: Omit<LabReport, 'id' | 'patientId'>
): LabReport {
  const vault = ensureVault(patientId)
  if (!vault) {
    throw new Error(`Patient vault not found for ${patientId}`)
  }

  const newReport: LabReport = {
    ...report,
    id: `lab-${globalThis.crypto.randomUUID()}`,
    patientId,
  }

  const nextVault: StoredVault = {
    ...vault,
    labReports: [...vault.labReports, newReport],
    updatedAt: new Date().toISOString(),
  }

  writeVault(nextVault)
  return newReport
}

export function getAbnormalLabReports(
  patientId: string
): LabReport[] {
  const vault = getVault(patientId)
  return vault ? vault.labReports.filter((report) => report.isAbnormal) : []
}

export function addAllergy(
  patientId: string,
  allergy: string
): void {
  const vault = ensureVault(patientId)
  if (!vault) {
    return
  }

  const normalizedAllergy = allergy.trim()
  if (!normalizedAllergy || vault.allergies.includes(normalizedAllergy)) {
    return
  }

  writeVault({
    ...vault,
    allergies: [...vault.allergies, normalizedAllergy],
    updatedAt: new Date().toISOString(),
  })
}

export function removeAllergy(
  patientId: string,
  allergy: string
): void {
  const vault = ensureVault(patientId)
  if (!vault) {
    return
  }

  writeVault({
    ...vault,
    allergies: vault.allergies.filter((item) => item !== allergy),
    updatedAt: new Date().toISOString(),
  })
}

export function toggleEmergencyAccess(
  patientId: string,
  enabled: boolean
): void {
  const vault = ensureVault(patientId)
  if (!vault) {
    return
  }

  const updatedVault: StoredVault = {
    ...vault,
    emergencyAccessEnabled: enabled,
    updatedAt: new Date().toISOString(),
  }
  writeVault(updatedVault)
  void addLedgerEntry(
    enabled ? LEDGER_EVENTS.EMERGENCY_ACCESS_ENABLED : LEDGER_EVENTS.EMERGENCY_ACCESS_DISABLED,
    patientId,
    'system',
    'Full Medical History'
  )
}

export function getVaultStats(patientId: string): {
  totalPrescriptions: number
  activePrescriptions: number
  totalLabReports: number
  abnormalLabReports: number
  totalAllergies: number
  lastUpdated: string
} {
  const vault = getVault(patientId)
  if (!vault) {
    return {
      totalPrescriptions: 0,
      activePrescriptions: 0,
      totalLabReports: 0,
      abnormalLabReports: 0,
      totalAllergies: 0,
      lastUpdated: '',
    }
  }

  const stored = readVault(patientId)
  return {
    totalPrescriptions: vault.prescriptions.length,
    activePrescriptions: vault.prescriptions.filter((prescription) => prescription.isActive).length,
    totalLabReports: vault.labReports.length,
    abnormalLabReports: vault.labReports.filter((report) => report.isAbnormal).length,
    totalAllergies: vault.allergies.length,
    lastUpdated: stored?.updatedAt ?? '',
  }
}

export function downloadVaultAsJSON(patientId: string): void {
  if (typeof document === 'undefined') {
    return
  }

  const vault = getVault(patientId)
  if (!vault) {
    return
  }

  const payload = JSON.stringify(vault, null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = `health-vault-${patientId}-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}
