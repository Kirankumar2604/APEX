'use client'

import { useCallback, useEffect, useState } from 'react'
import type { LabReport, PatientVault, Prescription } from '@/types'
import * as vault from '@/lib/vault'

export function useVault(patientId: string) {
  const [vaultData, setVaultData] = useState<PatientVault | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshVault = useCallback(() => {
    try {
      setVaultData(patientId ? vault.getVault(patientId) : null)
      setError(null)
    } catch {
      setError('Failed to load vault')
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    setIsLoading(true)
    refreshVault()
  }, [patientId, refreshVault])

  const addPrescription = useCallback(
    async (prescription: Omit<Prescription, 'id' | 'patientId'>) => {
      try {
        const nextPrescription = vault.addPrescription(patientId, prescription)
        refreshVault()
        return nextPrescription
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add prescription')
        throw err
      }
    },
    [patientId, refreshVault]
  )

  const addLabReport = useCallback(
    async (report: Omit<LabReport, 'id' | 'patientId'>) => {
      try {
        const nextReport = vault.addLabReport(patientId, report)
        refreshVault()
        return nextReport
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add lab report')
        throw err
      }
    },
    [patientId, refreshVault]
  )

  const addAllergy = useCallback(
    async (allergy: string) => {
      try {
        vault.addAllergy(patientId, allergy)
        refreshVault()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add allergy')
        throw err
      }
    },
    [patientId, refreshVault]
  )

  const removeAllergy = useCallback(
    async (allergy: string) => {
      try {
        vault.removeAllergy(patientId, allergy)
        refreshVault()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove allergy')
        throw err
      }
    },
    [patientId, refreshVault]
  )

  const toggleEmergencyAccess = useCallback(
    async (enabled: boolean) => {
      try {
        vault.toggleEmergencyAccess(patientId, enabled)
        refreshVault()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update emergency access')
        throw err
      }
    },
    [patientId, refreshVault]
  )

  const downloadVault = useCallback(() => {
    vault.downloadVaultAsJSON(patientId)
  }, [patientId])

  const stats = vaultData ? vault.getVaultStats(patientId) : null

  return {
    vaultData,
    isLoading,
    error,
    stats,
    addPrescription,
    addLabReport,
    addAllergy,
    removeAllergy,
    toggleEmergencyAccess,
    downloadVault,
    refreshVault,
  }
}
