import type { Prescription, FraudAnalysis } from '@/types'

interface FraudRequestBody {
  patientName: string
  prescriptions: Prescription[]
  medicationHistory: string[]
}

const SYSTEM_PROMPT = `You are a Prescription Fraud Detection Agent for a medical AI system.
Your role is to identify suspicious prescription patterns and potential
fraud for authorized review only. You analyze patterns, not individual
patients. Always explain your findings clearly.

Return ONLY a valid JSON object with NO additional text:
{
  "fraud_risk_score": number between 0 and 100,
  "flags": [
    {
      "type": "flag type name",
      "explanation": "detailed explanation",
      "severity": "HIGH" or "MEDIUM" or "LOW",
      "detected_by": "ai"
    }
  ],
  "summary": "overall summary of findings in 2-3 sentences",
  "disclaimer": "AI-generated pattern analysis for authorized review only. Not a legal determination."
}`

function buildUserMessage(body: FraudRequestBody): string {
  const prescriptions = body.prescriptions
    .map((prescription) => `- ${prescription.drugName} ${prescription.dosage} prescribed by ${prescription.prescribedBy} on ${prescription.prescribedDate}`)
    .join('\n')
  const medicationHistory = body.medicationHistory.length
    ? body.medicationHistory.map((item) => `- ${item}`).join('\n')
    : 'None'

  return `Analyze this prescription history for suspicious patterns:\n\nPatient: ${body.patientName}\n\nPRESCRIPTIONS:\n${prescriptions}\n\nMEDICATION HISTORY:\n${medicationHistory}\n\nLook for:\n1. Same drug prescribed by multiple doctors (doctor shopping)\n2. Controlled substances prescribed unusually frequently\n3. Duplicate medications with different dosages\n4. Unusual timing patterns between prescriptions\n5. Insurance fraud indicators\n6. Any other suspicious patterns\n\nReturn a fraud risk score 0-100 and list all flags found.`
}

function sanitizeJsonResponse(text: string): string {
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').replace(/`/g, '').trim()
  if (cleaned.startsWith('json')) {
    cleaned = cleaned.substring(4).trim()
  }
  return cleaned
}

function parseRiskLevel(value: string): FraudAnalysis['flags'][number]['severity'] {
  const normalized = value?.toUpperCase?.().trim()
  if (normalized === 'HIGH' || normalized === 'MEDIUM' || normalized === 'LOW' || normalized === 'SAFE') {
    return normalized
  }
  return 'LOW'
}

export async function POST(request: Request) {
  let body: FraudRequestBody

  try {
    body = (await request.json()) as FraudRequestBody
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { 'content-type': 'application/json' } })
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!openRouterKey && !anthropicKey) {
    const fraudAnalysis = getSimulatedFraudAnalysis(body)
    return new Response(JSON.stringify(fraudAnalysis), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  const userMessage = buildUserMessage(body)

  try {
    let text = ''
    if (openRouterKey) {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'PrescriptionNet'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        return new Response(JSON.stringify({ error: 'OpenRouter API error', details: errorText }), { status: 502, headers: { 'content-type': 'application/json' } })
      }

      const json = await response.json()
      text = String(json?.choices?.[0]?.message?.content ?? '')
    } else {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
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
      text = String(json?.content?.[0]?.text ?? '')
    }

    const cleaned = sanitizeJsonResponse(text)

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse AI response', raw: cleaned }), { status: 500, headers: { 'content-type': 'application/json' } })
    }

    const parsedObject = typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {}
    const flagsArray = Array.isArray(parsedObject.flags) ? parsedObject.flags as unknown[] : []

    const fraudAnalysis: FraudAnalysis = {
      fraudRiskScore: Number(parsedObject.fraud_risk_score) || 0,
      flags: flagsArray.map((flag) => {
        const candidate = typeof flag === 'object' && flag !== null ? flag as Record<string, unknown> : {}
        return {
          type: String(candidate.type ?? ''),
          explanation: String(candidate.explanation ?? ''),
          severity: parseRiskLevel(String(candidate.severity ?? 'LOW')),
          detectedBy: 'ai'
        }
      }),
      summary: String(parsedObject.summary ?? ''),
      disclaimer: String(parsedObject.disclaimer ?? 'AI-generated pattern analysis for authorized review only. Not a legal determination.')
    }

    return new Response(JSON.stringify(fraudAnalysis), { status: 200, headers: { 'content-type': 'application/json' } })
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: 'AI API request failed', details: String(error) }), { status: 502, headers: { 'content-type': 'application/json' } })
  }
}

function getSimulatedFraudAnalysis(body: FraudRequestBody): FraudAnalysis {
  const prescriptions = body.prescriptions.map(p => p.drugName.toLowerCase())
  const hasTramadol = prescriptions.includes('tramadol')
  const hasAspirin = prescriptions.includes('aspirin')
  
  const flags: any[] = []
  let fraudRiskScore = 5
  let summary = 'No fraud indicators detected. Prescription patterns appear within normal clinical parameters.'

  // Doctor Shopping Check
  const prescribers = new Set(body.prescriptions.map(p => p.prescribedBy))
  const tramadolRxs = body.prescriptions.filter(p => p.drugName.toLowerCase() === 'tramadol')
  
  if (hasTramadol && tramadolRxs.length >= 3 && prescribers.size >= 2) {
    flags.push({
      type: 'Doctor Shopping',
      explanation: `Patient received ${tramadolRxs.length} separate prescriptions for controlled substance Tramadol from ${prescribers.size} different doctors within a short window.`,
      severity: 'HIGH',
      detectedBy: 'ai'
    })
    flags.push({
      type: 'Controlled Substance Pattern',
      explanation: 'Frequent refills of controlled substances from different clinics suggests drug-seeking behavior.',
      severity: 'HIGH',
      detectedBy: 'ai'
    })
    fraudRiskScore = 82
    summary = 'High fraud risk score. Pattern suggests potential doctor shopping or drug-seeking behavior for controlled opioids.'
  } else if (hasAspirin && body.prescriptions.filter(p => p.drugName.toLowerCase() === 'aspirin').length >= 2) {
    flags.push({
      type: 'Duplicate Prescription',
      explanation: 'Aspirin prescribed by two different clinics at different dosages concurrently.',
      severity: 'MEDIUM',
      detectedBy: 'ai'
    })
    fraudRiskScore = 45
    summary = 'Moderate risk score. Duplicate prescriptions detected from different doctors, which may indicate coordination gaps or duplicate claims.'
  }

  return {
    fraudRiskScore,
    flags,
    summary,
    disclaimer: 'Simulated AI pattern fraud analysis. Provided for support/testing when API keys are not present.'
  }
}
