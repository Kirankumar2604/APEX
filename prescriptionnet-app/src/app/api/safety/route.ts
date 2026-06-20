import { NextRequest, NextResponse } from 'next/server'
import type { PatientVault, SafetyAnalysis } from '@/types'

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

    // Build prompt for Claude
    const prescriptionsList = vault.prescriptions
      .map(
        (rx) =>
          `- ${rx.drugName} ${rx.dosage}, ${rx.frequency} (by ${rx.prescribedBy})`
      )
      .join('\n')

    const allergiesList = vault.allergies.join(', ') || 'None reported'
    const conditionsList = vault.conditions.join(', ') || 'None reported'

    const prompt = `You are a Clinical Safety Agent analyzing prescription data.

Patient: ${vault.patientName} (DOB: ${vault.dateOfBirth}, Blood Group: ${vault.bloodGroup})
Known Allergies: ${allergiesList}
Medical Conditions: ${conditionsList}

Current Prescriptions:
${prescriptionsList}

Medication History: ${vault.medicationHistory.join('; ')}

Analyze this patient's prescriptions for:
1. Potential drug interactions
2. Duplicate medications
3. Allergy conflicts
4. Medication safety risks

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "drug_interactions": [{"drugs": ["drug1", "drug2"], "severity": "HIGH|MEDIUM|LOW|SAFE", "explanation": "..."}],
  "duplicate_medications": [{"drug": "...", "explanation": "..."}],
  "allergy_conflicts": [{"drug": "...", "allergy": "...", "explanation": "..."}],
  "medication_safety_risks": [{"risk": "...", "explanation": "..."}],
  "overall_risk_level": "HIGH|MEDIUM|LOW|SAFE",
  "disclaimer": "This analysis is for physician review only and not a substitute for professional medical judgment."
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
        max_tokens: 2000,
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
      return NextResponse.json(
        { error: 'Failed to analyze prescriptions' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const responseText = data.content[0]?.text || ''

    // Parse JSON from response
    let analysis
    try {
      // Try to extract JSON if it's wrapped in markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : responseText
      analysis = JSON.parse(jsonString)
    } catch {
      console.error('Failed to parse Claude response:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse analysis response' },
        { status: 500 }
      )
    }

    // Map response to SafetyAnalysis type
    const safetyAnalysis: SafetyAnalysis = {
      drugInteractions: analysis.drug_interactions || [],
      duplicateMedications: analysis.duplicate_medications || [],
      allergyConflicts: analysis.allergy_conflicts || [],
      medicationSafetyRisks: analysis.medication_safety_risks || [],
      overallRiskLevel: analysis.overall_risk_level || 'SAFE',
      disclaimer:
        analysis.disclaimer ||
        'AI-generated analysis for physician review only.',
    }

    // Increment counter
    if (typeof window === 'undefined') {
      // Server-side counter tracking would go here
    }

    return NextResponse.json(safetyAnalysis)
  } catch (error) {
    console.error('Safety analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
