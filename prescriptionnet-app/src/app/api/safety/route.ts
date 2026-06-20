import type { LabReport, Prescription, SafetyAnalysis } from '@/types'

interface SafetyRequestBody {
  patientName: string
  prescriptions: Prescription[]
  allergies: string[]
  conditions: string[]
  labReports: LabReport[]
  medicationHistory: string[]
  bloodGroup?: string
}

const SYSTEM_PROMPT = `You are a Clinical Safety Agent for a medical AI system.
Your role is to analyze prescription data and identify potential
safety concerns for physician review. You are NOT a replacement
for medical professionals. Always explain your reasoning clearly
and flag concerns for human review only.

Analyze the provided patient prescription data and return ONLY
a valid JSON object with NO additional text, no markdown,
no code blocks. Return exactly this structure:
{
  'drug_interactions': [
    {
      'drugs': ['drug1', 'drug2'],
      'severity': 'HIGH' or 'MEDIUM' or 'LOW',
      'explanation': 'detailed explanation of why this is dangerous'
    }
  ],
  'duplicate_medications': [
    {
      'drug': 'drug name',
      'explanation': 'explanation of duplication issue'
    }
  ],
  'allergy_conflicts': [
    {
      'drug': 'drug name',
      'allergy': 'allergy name',
      'explanation': 'why this is dangerous'
    }
  ],
  'medication_safety_risks': [
    {
      'risk': 'risk description',
      'explanation': 'detailed explanation'
    }
  ],
  'overall_risk_level': 'HIGH' or 'MEDIUM' or 'LOW' or 'SAFE',
  'disclaimer': 'AI-generated insights for physician review only.\n    Not a substitute for professional medical judgment.'
}`

function buildUserMessage(body: SafetyRequestBody): string {
  const conditions = body.conditions.length ? body.conditions.join(', ') : 'None'
  const allergies = body.allergies.length ? body.allergies.join(', ') : 'None'
  const prescriptions = body.prescriptions
    .map((prescription) => {
      const status = prescription.isActive ? 'Active' : 'Expired'
      return `- ${prescription.drugName} ${prescription.dosage} - ${prescription.frequency}\n  Prescribed by: ${prescription.prescribedBy} on ${prescription.prescribedDate}\n  Status: ${status}`
    })
    .join('\n')
  const labResults = body.labReports
    .map((labReport) => {
      const abnormal = labReport.isAbnormal ? 'ABNORMAL' : ''
      return `- ${labReport.testName}: ${labReport.result} (Reference: ${labReport.referenceRange}) ${abnormal}`.trim()
    })
    .join('\n')
  const medicationHistory = body.medicationHistory.length
    ? body.medicationHistory.map((item) => `- ${item}`).join('\n')
    : 'None'

  return `Analyze this patient's prescription data for safety concerns:\n\nPatient: ${body.patientName}\nConditions: ${conditions}\nAllergies: ${allergies}\nBlood Group: ${body.bloodGroup ?? 'Unknown'}\n\nCURRENT PRESCRIPTIONS:\n${prescriptions}\n\nLAB RESULTS:\n${labResults}\n\nMEDICATION HISTORY:\n${medicationHistory}\n\nIdentify ALL drug interactions, allergy conflicts, duplicate medications, and safety risks.`
}

function sanitizeJsonResponse(text: string): string {
  const stripped = text.replace(/```/g, '').replace(/`/g, '').trim()
  return stripped
}

function parseRiskLevel(value: string): SafetyAnalysis['overallRiskLevel'] {
  const normalized = value?.toUpperCase?.().trim()
  if (normalized === 'HIGH' || normalized === 'MEDIUM' || normalized === 'LOW' || normalized === 'SAFE') {
    return normalized
  }
  return 'LOW'
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Anthropic API key' }), { status: 500, headers: { 'content-type': 'application/json' } })
  }

  let body: SafetyRequestBody

  try {
    body = (await request.json()) as SafetyRequestBody
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { 'content-type': 'application/json' } })
  }

  if (!Array.isArray(body.prescriptions) || body.prescriptions.length === 0) {
    return new Response(JSON.stringify({ error: 'Prescriptions are required' }), { status: 400, headers: { 'content-type': 'application/json' } })
  }

  const userMessage = buildUserMessage(body)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(JSON.stringify({ error: 'Claude API error', details: errorText }), { status: 502, headers: { 'content-type': 'application/json' } })
    }

    const json = await response.json()
    const text = String(json?.content?.[0]?.text ?? '')
    const cleaned = sanitizeJsonResponse(text)

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse Claude response', raw: cleaned }), { status: 500, headers: { 'content-type': 'application/json' } })
    }

    const parsedObject = typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {}

    const toArray = <T>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : [])

    const safetyAnalysis: SafetyAnalysis = {
      drugInteractions: toArray<Record<string, unknown>>(parsedObject.drug_interactions).map((interaction) => ({
        drugs: Array.isArray(interaction?.drugs) ? interaction.drugs.map(String) : [],
        severity: parseRiskLevel(String(interaction?.severity ?? 'LOW')),
        explanation: String(interaction?.explanation ?? '')
      })),
      duplicateMedications: toArray<Record<string, unknown>>(parsedObject.duplicate_medications).map((duplicate) => ({
        drug: String(duplicate?.drug ?? ''),
        explanation: String(duplicate?.explanation ?? '')
      })),
      allergyConflicts: toArray<Record<string, unknown>>(parsedObject.allergy_conflicts).map((conflict) => ({
        drug: String(conflict?.drug ?? ''),
        allergy: String(conflict?.allergy ?? ''),
        explanation: String(conflict?.explanation ?? '')
      })),
      medicationSafetyRisks: toArray<Record<string, unknown>>(parsedObject.medication_safety_risks).map((risk) => ({
        risk: String(risk?.risk ?? ''),
        explanation: String(risk?.explanation ?? '')
      })),
      overallRiskLevel: parseRiskLevel(String(parsedObject.overall_risk_level ?? 'LOW')),
      disclaimer: String(parsedObject.disclaimer ?? 'AI-generated insights for physician review only. Not a substitute for professional medical judgment.')
    }

    return new Response(JSON.stringify(safetyAnalysis), { status: 200, headers: { 'content-type': 'application/json' } })
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: 'Claude API request failed', details: String(error) }), { status: 502, headers: { 'content-type': 'application/json' } })
  }
}
