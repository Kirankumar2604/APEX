'use client'

import { useState, useCallback } from 'react'
import type { PatientVault, SafetyAnalysis, FraudAnalysis } from '@/types'
import { analyzePrescriptions, detectFraudPatterns } from '@/lib/claude'
import { runAllFraudRules, combineFraudResults, calculateRuleBasedScore } from '@/lib/fraudRules'

interface LocalAIState {
  safetyAnalysis: SafetyAnalysis | null
  fraudAnalysis: FraudAnalysis | null
  isLoadingSafety: boolean
  isLoadingFraud: boolean
  safetyError: string | null
  fraudError: string | null
  lastAnalyzedPatientId: string | null
}

const initialState: LocalAIState = {
  safetyAnalysis: null,
  fraudAnalysis: null,
  isLoadingSafety: false,
  isLoadingFraud: false,
  safetyError: null,
  fraudError: null,
  lastAnalyzedPatientId: null
}

export function useAI() {
  const [state, setState] = useState<LocalAIState>(initialState)

  const runSafetyAnalysis = useCallback(async (vault: PatientVault) => {
    setState((prev) => ({ ...prev, isLoadingSafety: true, safetyError: null }))

    try {
      const analysis = await analyzePrescriptions(vault)
      window.localStorage.setItem(`safety_analysis_${vault.patientId}`, JSON.stringify(analysis))
      setState((prev) => ({
        ...prev,
        safetyAnalysis: analysis,
        isLoadingSafety: false,
        lastAnalyzedPatientId: vault.patientId
      }))
      return analysis
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        safetyError: String(error),
        isLoadingSafety: false
      }))
      throw error
    }
  }, [])

  const runFraudDetection = useCallback(async (vault: PatientVault) => {
    setState((prev) => ({ ...prev, isLoadingFraud: true, fraudError: null }))

    try {
      const ruleFlags = runAllFraudRules(vault.prescriptions)
      const ruleScore = calculateRuleBasedScore(ruleFlags)
      const partial: FraudAnalysis = {
        fraudRiskScore: ruleScore,
        flags: ruleFlags,
        summary: 'Rule-based fraud rules detected patterns while AI analysis is pending.',
        disclaimer: 'AI-generated pattern analysis for authorized review only. Not a legal determination.'
      }
      setState((prev) => ({ ...prev, fraudAnalysis: partial }))

      const aiResult = await detectFraudPatterns(vault)
      const combined = combineFraudResults(ruleFlags, aiResult, ruleScore)
      window.localStorage.setItem(`fraud_analysis_${vault.patientId}`, JSON.stringify(combined))
      setState((prev) => ({
        ...prev,
        fraudAnalysis: combined,
        isLoadingFraud: false,
        lastAnalyzedPatientId: vault.patientId
      }))
      return combined
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        fraudError: String(error),
        isLoadingFraud: false
      }))
      throw error
    }
  }, [])

  const runFullAnalysis = useCallback(async (vault: PatientVault) => {
    await Promise.all([runSafetyAnalysis(vault), runFraudDetection(vault)])
  }, [runSafetyAnalysis, runFraudDetection])

  const clearAnalysis = useCallback(() => {
    setState(initialState)
  }, [])

  const getCachedSafety = useCallback((patientId: string) => {
    if (typeof window === 'undefined') {
      return null
    }
    try {
      const stored = window.localStorage.getItem(`safety_analysis_${patientId}`)
      return stored ? (JSON.parse(stored) as SafetyAnalysis) : null
    } catch {
      return null
    }
  }, [])

  const getCachedFraud = useCallback((patientId: string) => {
    if (typeof window === 'undefined') {
      return null
    }
    try {
      const stored = window.localStorage.getItem(`fraud_analysis_${patientId}`)
      return stored ? (JSON.parse(stored) as FraudAnalysis) : null
    } catch {
      return null
    }
  }, [])

  return {
    ...state,
    runSafetyAnalysis,
    runFraudDetection,
    runFullAnalysis,
    clearAnalysis,
    getCachedSafety,
    getCachedFraud
  }
}
