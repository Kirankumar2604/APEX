/*
QUICK TEST CHECKLIST:
1. Safety API: POST /api/safety with Rajesh Kumar data
   Expected: HIGH overall risk, Warfarin+Aspirin interaction
2. Fraud API: POST /api/fraud with Ananya Singh data
   Expected: HIGH fraud score, Tramadol doctor shopping flag
3. Rule detection: Rajesh has duplicate Aspirin → should flag
4. Risk gauge: Score 85 should show red, 45 orange, 15 green
5. ExplainabilityCard: HIGH severity should have red border
*/

import type { PatientVault, SafetyAnalysis, FraudAnalysis } from '@/types'

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${text}`)
  }
  try {
    return JSON.parse(text) as T
  } catch (error: unknown) {
    throw new Error(`Failed to parse API response: ${String(error)} - ${text}`)
  }
}

export async function analyzePrescriptions(vault: PatientVault): Promise<SafetyAnalysis> {
  try {
    const response = await fetch('/api/safety', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        patientName: vault.patientName,
        prescriptions: vault.prescriptions,
        allergies: vault.allergies,
        conditions: vault.conditions,
        labReports: vault.labReports,
        medicationHistory: vault.medicationHistory,
        bloodGroup: vault.bloodGroup
      })
    })

    return await parseJsonResponse<SafetyAnalysis>(response)
  } catch (error: unknown) {
    throw new Error(`Safety analysis failed: ${String(error)}`)
  }
}

export async function detectFraudPatterns(vault: PatientVault): Promise<FraudAnalysis> {
  try {
    const response = await fetch('/api/fraud', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        patientName: vault.patientName,
        prescriptions: vault.prescriptions,
        medicationHistory: vault.medicationHistory
      })
    })

    return await parseJsonResponse(response)
  } catch (error: unknown) {
    throw new Error(`Fraud detection failed: ${String(error)}`)
  }
}

export async function analyzeWithRetry(fn: () => Promise<unknown>, maxRetries = 3, delayMs = 1000): Promise<unknown> {
  let attempt = 1
  let lastError: unknown = null

  while (attempt <= maxRetries) {
    try {
      console.log(`AI retry attempt ${attempt}`)
      return await fn()
    } catch (error: unknown) {
      lastError = error
      if (attempt === maxRetries) {
        throw error
      }
      const waitMs = delayMs * 2 ** (attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, waitMs))
      attempt += 1
    }
  }

  throw lastError
}
