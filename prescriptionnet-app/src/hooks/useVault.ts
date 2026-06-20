'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PatientVault, Prescription, LabReport } from '@/types'
import {
  getVault,
  saveVault,
  addPrescription,
  addLabReport,
  addAllergy,
  removeAllergy,
  toggleEmergencyAccess,
  getVaultStats,
} from '@/lib/vault'

export function useVault(patientId: string) {
  const [vaultData, setVaultData] = useState<PatientVault | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalPrescriptions: 0,
    activePrescriptions: 0,
    totalLabReports: 0,
    abnormalLabReports: 0,
    totalAllergies: 0,
  })

  const refreshVault = useCallback(() => {
    try {
      setIsLoading(true)
      const vault = getVault(patientId)
      setVaultData(vault)
      if (vault) {
        setStats(getVaultStats(patientId))
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vault')
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    refreshVault()
  }, [patientId, refreshVault])

  const handleAddPrescription = useCallback(
    async (prescription: Omit<Prescription, 'id' | 'patientId'>) => {
      try {
        setIsLoading(true)
        addPrescription(patientId, prescription)
        refreshVault()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to add prescription'
        setError(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [patientId, refreshVault]
  )

  const handleAddLabReport = useCallback(
    async (report: Omit<LabReport, 'id' | 'patientId'>) => {
      try {
        setIsLoading(true)
        addLabReport(patientId, report)
        refreshVault()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to add lab report'
        setError(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [patientId, refreshVault]
  )

  const handleAddAllergy = useCallback(
    (allergy: string) => {
      try {
        addAllergy(patientId, allergy)
        refreshVault()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to add allergy'
        setError(msg)
      }
    },
    [patientId, refreshVault]
  )

  const handleRemoveAllergy = useCallback(
    (allergy: string) => {
      try {
        removeAllergy(patientId, allergy)
        refreshVault()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to remove allergy'
        setError(msg)
      }
    },
    [patientId, refreshVault]
  )

  const handleToggleEmergencyAccess = useCallback(
    (enabled: boolean) => {
      try {
        toggleEmergencyAccess(patientId, enabled)
        refreshVault()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to toggle emergency access'
        setError(msg)
      }
    },
    [patientId, refreshVault]
  )

  const downloadVault = useCallback(() => {
    try {
      const vault = getVault(patientId)
      if (!vault) return

      const dataStr = JSON.stringify(vault, null, 2)
      const dataUri =
        'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
      const exportFileDefaultName = `vault_${patientId}_${new Date().toISOString().split('T')[0]}.json`

      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to download vault'
      setError(msg)
    }
  }, [patientId])

  return {
    vaultData,
    isLoading,
    error,
    stats,
    addPrescription: handleAddPrescription,
    addLabReport: handleAddLabReport,
    addAllergy: handleAddAllergy,
    removeAllergy: handleRemoveAllergy,
    toggleEmergencyAccess: handleToggleEmergencyAccess,
    downloadVault,
    refreshVault,
  }
}
