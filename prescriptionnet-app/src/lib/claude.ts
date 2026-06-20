import type { PatientVault, SafetyAnalysis, FraudAnalysis } from '@/types'

export async function analyzePrescriptions(vault: PatientVault): Promise<SafetyAnalysis> {
  try {
    const response = await fetch('/api/safety', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vault),
    })

    if (!response.ok) {
      throw new Error(`Safety analysis failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data as SafetyAnalysis
  } catch (error) {
    console.error('Failed to analyze prescriptions:', error)
    throw error
  }
}

export async function detectFraudPatterns(vault: PatientVault): Promise<FraudAnalysis> {
  try {
    const response = await fetch('/api/fraud', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vault),
    })

    if (!response.ok) {
      throw new Error(`Fraud detection failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data as FraudAnalysis
  } catch (error) {
    console.error('Failed to detect fraud patterns:', error)
    throw error
  }
}

export async function analyzeWithRetry(
  fn: () => Promise<any>,
  maxRetries: number = 3
): Promise<any> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
      console.log(
        `Attempt ${attempt + 1} failed, retrying in ${delay}ms...`
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Analysis failed after retries')
}
