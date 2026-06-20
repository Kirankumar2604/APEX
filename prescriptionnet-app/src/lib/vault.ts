import type { PatientVault, Prescription, LabReport, ConsentScope } from '@/types'
import { addLedgerEntry, LEDGER_EVENTS } from './ledger'

export function getVault(patientId: string): PatientVault | null {
  if (typeof window === 'undefined') return null
  try {
    const data = localStorage.getItem(`vault_${patientId}`)
    return data ? JSON.parse(data) : null
  } catch { return null }
}

export function saveVault(vault: PatientVault): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`vault_${vault.patientId}`, JSON.stringify(vault))
  } catch (e) { console.error('Failed to save vault:', e) }
}

export function updateVault(patientId: string, updates: Partial<PatientVault>): PatientVault | null {
  const vault = getVault(patientId)
  if (!vault) return null
  const updated = { ...vault, ...updates }
  saveVault(updated)
  return updated
}

export function getVaultByScope(patientId: string, scope: ConsentScope): Partial<PatientVault> | null {
  const vault = getVault(patientId)
  if (!vault) return null
  switch (scope) {
    case 'Prescriptions Only':
      return { patientId: vault.patientId, patientName: vault.patientName, prescriptions: vault.prescriptions }
    case 'Lab Reports Only':
      return { patientId: vault.patientId, patientName: vault.patientName, labReports: vault.labReports }
    case 'Allergies Only':
      return { patientId: vault.patientId, patientName: vault.patientName, allergies: vault.allergies, conditions: vault.conditions }
    case 'Full Medical History':
      return vault
    default:
      return vault
  }
}

export function addPrescription(patientId: string, prescription: Omit<Prescription, 'id' | 'patientId'>): Prescription {
  const vault = getVault(patientId)
  if (!vault) throw new Error('Vault not found')
  const newPrescription: Prescription = {
    ...prescription,
    id: `rx-${crypto.randomUUID()}`,
    patientId
  }
  vault.prescriptions.push(newPrescription)
  saveVault(vault)
  return newPrescription
}

export function addLabReport(patientId: string, report: Omit<LabReport, 'id' | 'patientId'>): LabReport {
  const vault = getVault(patientId)
  if (!vault) throw new Error('Vault not found')
  const newReport: LabReport = {
    ...report,
    id: `lab-${crypto.randomUUID()}`,
    patientId
  }
  vault.labReports.push(newReport)
  saveVault(vault)
  return newReport
}

export function addAllergy(patientId: string, allergy: string): void {
  const vault = getVault(patientId)
  if (!vault) return
  if (!vault.allergies.includes(allergy)) {
    vault.allergies.push(allergy)
    saveVault(vault)
  }
}

export function removeAllergy(patientId: string, allergy: string): void {
  const vault = getVault(patientId)
  if (!vault) return
  vault.allergies = vault.allergies.filter(a => a !== allergy)
  saveVault(vault)
}

export function getActivePrescriptions(patientId: string): Prescription[] {
  const vault = getVault(patientId)
  return vault?.prescriptions.filter(p => p.isActive) || []
}

export function getAbnormalLabReports(patientId: string): LabReport[] {
  const vault = getVault(patientId)
  return vault?.labReports.filter(l => l.isAbnormal) || []
}

export function toggleEmergencyAccess(patientId: string, enabled: boolean): void {
  const vault = getVault(patientId)
  if (!vault) return
  vault.emergencyAccessEnabled = enabled
  saveVault(vault)
  addLedgerEntry(
    enabled ? LEDGER_EVENTS.EMERGENCY_ACCESS_ENABLED : 'EMERGENCY_ACCESS_DISABLED',
    patientId, 'system', 'Full Medical History'
  )
}

export function getVaultStats(patientId: string) {
  const vault = getVault(patientId)
  if (!vault) return { totalPrescriptions: 0, activePrescriptions: 0, totalLabReports: 0, abnormalLabReports: 0, totalAllergies: 0 }
  return {
    totalPrescriptions: vault.prescriptions.length,
    activePrescriptions: vault.prescriptions.filter(p => p.isActive).length,
    totalLabReports: vault.labReports.length,
    abnormalLabReports: vault.labReports.filter(l => l.isAbnormal).length,
    totalAllergies: vault.allergies.length
  }
}

export function downloadVaultAsJSON(patientId: string): void {
  const vault = getVault(patientId)
  if (!vault) return
  const blob = new Blob([JSON.stringify(vault, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `health-vault-${patientId}-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getAllVaults(): PatientVault[] {
  if (typeof window === 'undefined') return []
  try {
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const patients = users.filter((u: any) => u.role === "patient")
    return patients.map((p: any) => getVault(p.id)).filter(Boolean) as PatientVault[]
  } catch { return [] }
}
