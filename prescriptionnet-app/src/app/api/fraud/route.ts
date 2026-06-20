import { NextRequest, NextResponse } from 'next/server'
import type { PatientVault, FraudAnalysis } from '@/types'
import { runAllFraudRules, calculateRuleBasedScore, combineFraudResults } from '@/lib/fraudRules'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const vault: PatientVault = await request.json()

    // Validate vault
    if (!vault.patientId || !vault.prescriptions) {
      return NextResponse.json(
        { error: 'Invalid vault data' },
        { status: 400 }
      )
    }

    // 1. Run rule-based fraud detection first (instant)
    const ruleFlags = runAllFraudRules(vault.prescriptions)
    const ruleScore = calculateRuleBasedScore(ruleFlags)

    // 2. Run AI analysis
    const prescriptionsList = vault.prescriptions
      .map(
        (rx) =>
          `- ${rx.drugName} ${rx.dosage}, ${rx.frequency} (by ${rx.prescribedBy}, prescribed: ${rx.prescribedDate})`
      )
      .join('\n')

    const prompt = `You are a Prescription Fraud Detection Agent.

Patient: ${vault.patientName}
Patient ID: ${vault.patientId}

Current Prescriptions:
${prescriptionsList}

Analyze for fraud patterns including:
1. Doctor shopping (multiple prescribers for same drug)
2. Rapid refills (multiple fills in short timeframe)
3. Controlled substance abuse patterns
4. Prescription alterations or forgeries (if detectable from data)
5. Dosage irregularities

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "fraud_risk_score": 0-100,
  "flags": [{"type": "...", "explanation": "...", "severity": "HIGH|MEDIUM|LOW", "detected_by": "ai"}],
  "summary": "...",
  "disclaimer": "This analysis is AI-assisted and must be reviewed by qualified professionals."
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', errorText)

      // Fall back to rule-based analysis only
      const fallbackAnalysis: FraudAnalysis = {
        fraudRiskScore: ruleScore,
        flags: ruleFlags,
        summary: ruleScore > 50 ? 'Rule-based fraud risk detected' : 'Low fraud risk',
        disclaimer:
          'Rule-based analysis only. AI analysis unavailable. Review by physician recommended.',
      }

      return NextResponse.json(fallbackAnalysis)
    }

    const data = await response.json()
    const responseText = data.content[0]?.text || ''

    // Parse JSON from response
    let aiAnalysis
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : responseText
      aiAnalysis = JSON.parse(jsonString)
    } catch {
      console.error('Failed to parse Claude response:', responseText)
      // Fall back to rule-based analysis
      const fallbackAnalysis: FraudAnalysis = {
        fraudRiskScore: ruleScore,
        flags: ruleFlags,
        summary: 'Rule-based fraud analysis completed',
        disclaimer: 'Analysis based on rule engine only.',
      }

      return NextResponse.json(fallbackAnalysis)
    }

    // Combine rule-based and AI results
    const combinedAnalysis: FraudAnalysis = {
      fraudRiskScore: aiAnalysis.fraud_risk_score || ruleScore,
      flags: [
        ...ruleFlags,
        ...(aiAnalysis.flags || []).map((f: any) => ({
          ...f,
          severity: f.severity || 'MEDIUM',
          detectedBy: 'ai' as const,
        })),
      ],
      summary: aiAnalysis.summary || 'Fraud analysis completed',
      disclaimer:
        aiAnalysis.disclaimer ||
        'AI-assisted fraud detection for physician review only.',
    }

    // Increment fraud counter if needed
    if (combinedAnalysis.fraudRiskScore > 50) {
      // Fraud alert counter would be incremented here
    }

    return NextResponse.json(combinedAnalysis)
  } catch (error) {
    console.error('Fraud detection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
