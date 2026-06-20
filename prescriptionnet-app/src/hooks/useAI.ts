'use client'

import { useState, useCallback } from 'react'
import type { PatientVault, SafetyAnalysis, FraudAnalysis } from '@/types'
import { analyzePrescriptions, detectFraudPatterns, analyzeWithRetry } from '@/lib/claude'
import { runAllFraudRules, calculateRuleBasedScore, combineFraudResults } from '@/lib/fraudRules'

export function useAI() {
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(null)
  const [fraudAnalysis, setFraudAnalysis] = useState<FraudAnalysis | null>(null)
  const [isLoadingSafety, setIsLoadingSafety] = useState(false)
  const [isLoadingFraud, setIsLoadingFraud] = useState(false)
  const [safetyError, setSafetyError] = useState<string | null>(null)
  const [fraudError, setFraudError] = useState<string | null>(null)

  const runSafetyAnalysis = useCallback(async (vault: PatientVault) => {
    setIsLoadingSafety(true)
    setSafetyError(null)
    try {
      const analysis = await analyzeWithRetry(() => analyzePrescriptions(vault))
      setSafetyAnalysis(analysis)

      // Increment counter
      if (typeof window !== 'undefined') {
        const count = parseInt(localStorage.getItem('aiAnalysesCount') || '0')
        localStorage.setItem('aiAnalysesCount', String(count + 1))
      }

      return analysis
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Safety analysis failed'
      setSafetyError(msg)
      throw error
    } finally {
      setIsLoadingSafety(false)
    }
  }, [])

  const runFraudDetection = useCallback(async (vault: PatientVault) => {
    setIsLoadingFraud(true)
    setFraudError(null)
    try {
      // 1. Run rule-based detection first (instant)
      const ruleFlags = runAllFraudRules(vault.prescriptions)
      const ruleScore = calculateRuleBasedScore(ruleFlags)

      // 2. Run AI analysis
      const aiAnalysis = await analyzeWithRetry(() => detectFraudPatterns(vault))

      // 3. Combine results
      const combined = combineFraudResults(ruleFlags, aiAnalysis, ruleScore)
      setFraudAnalysis(combined)

      // Increment fraud alerts counter if high risk
      if (combined.fraudRiskScore > 50 && typeof window !== 'undefined') {
        const count = parseInt(localStorage.getItem('fraudAlertsToday') || '0')
        localStorage.setItem('fraudAlertsToday', String(count + 1))
      }

      return combined
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Fraud detection failed'
      setFraudError(msg)
      throw error
    } finally {
      setIsLoadingFraud(false)
    }
  }, [])

  const runFullAnalysis = useCallback(
    async (vault: PatientVault) => {
      try {
        const [safety, fraud] = await Promise.all([
          runSafetyAnalysis(vault),
          runFraudDetection(vault),
        ])
        return { safety, fraud }
      } catch (error) {
        console.error('Full analysis failed:', error)
        throw error
      }
    },
    [runSafetyAnalysis, runFraudDetection]
  )

  const clearAnalysis = useCallback(() => {
    setSafetyAnalysis(null)
    setFraudAnalysis(null)
    setSafetyError(null)
    setFraudError(null)
  }, [])

  const getCachedSafety = useCallback(() => safetyAnalysis, [safetyAnalysis])
  const getCachedFraud = useCallback(() => fraudAnalysis, [fraudAnalysis])

  return {
    safetyAnalysis,
    fraudAnalysis,
    isLoadingSafety,
    isLoadingFraud,
    safetyError,
    fraudError,
    runSafetyAnalysis,
    runFraudDetection,
    runFullAnalysis,
    clearAnalysis,
    getCachedSafety,
    getCachedFraud,
  }
}
