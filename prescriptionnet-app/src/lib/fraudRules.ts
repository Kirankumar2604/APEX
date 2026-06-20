import type { Prescription, FraudFlag, FraudAnalysis } from '@/types'

const CONTROLLED_SUBSTANCES = [
  'Tramadol',
  'Alprazolam',
  'Diazepam',
  'Codeine',
  'Morphine',
  'Oxycodone',
  'Fentanyl',
  'Zolpidem',
  'Clonazepam',
  'Lorazepam',
  'Ritalin',
  'Adderall'
]

const DOSAGE_THRESHOLDS: Record<string, number> = {
  Tramadol: 400,
  Alprazolam: 4,
  Warfarin: 10,
  Metformin: 2000,
  Digoxin: 0.5
}

function parseDate(value: string): Date | null {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseMg(dosage: string): number {
  const match = dosage.match(/([\d.]+)\s*mg/i)
  return match ? Number(match[1]) : 0
}

export function detectDoctorShopping(prescriptions: Prescription[]): FraudFlag | null {
  const drugDoctorMap = new Map<string, Set<string>>()
  prescriptions.forEach((prescription) => {
    const drug = prescription.drugName.trim()
    const doctor = prescription.prescribedBy.trim()
    if (!drugDoctorMap.has(drug)) {
      drugDoctorMap.set(drug, new Set())
    }
    drugDoctorMap.get(drug)?.add(doctor)
  })

  let result: FraudFlag | null = null
  drugDoctorMap.forEach((prescribers, drug) => {
    if (result) {
      return
    }
    if (prescribers.size >= 3) {
      const doctors = Array.from(prescribers).join(', ')
      result = {
        type: 'Doctor Shopping',
        explanation: `${drug} prescribed by ${prescribers.size} different doctors: ${doctors}`,
        severity: 'HIGH',
        detectedBy: 'rule'
      }
    }
  })

  return result

  return null
}

export function detectDuplicateFill(prescriptions: Prescription[]): FraudFlag[] {
  const flags: FraudFlag[] = []
  const grouped = new Map<string, Prescription[]>()

  prescriptions.forEach((prescription) => {
    const key = `${prescription.drugName}::${prescription.prescribedBy}`
    const list = grouped.get(key) ?? []
    list.push(prescription)
    grouped.set(key, list)
  })

  grouped.forEach((prescriptionsByKey) => {
    const sorted = prescriptionsByKey
      .map((prescription) => ({ prescription, date: parseDate(prescription.prescribedDate) }))
      .filter((entry) => entry.date)
      .sort((a, b) => a.date!.getTime() - b.date!.getTime())

    for (let i = 1; i < sorted.length; i += 1) {
      const current = sorted[i]
      const previous = sorted[i - 1]
      if (current.date && previous.date) {
        const days = Math.abs(current.date.getTime() - previous.date.getTime()) / (1000 * 60 * 60 * 24)
        if (days <= 7) {
          flags.push({
            type: 'Duplicate Fill',
            explanation: `${current.prescription.drugName} filled twice by ${current.prescription.prescribedBy} within ${Math.round(days)} days`,
            severity: 'HIGH',
            detectedBy: 'rule'
          })
          break
        }
      }
    }
  })

  return flags
}

export function detectRapidRepeat(prescriptions: Prescription[]): FraudFlag[] {
  const flags: FraudFlag[] = []
  const grouped = new Map<string, Date[]>()

  prescriptions.forEach((prescription) => {
    const drug = prescription.drugName.trim()
    if (!CONTROLLED_SUBSTANCES.includes(drug)) {
      return
    }
    const date = parseDate(prescription.prescribedDate)
    if (!date) {
      return
    }
    const list = grouped.get(drug) ?? []
    list.push(date)
    grouped.set(drug, list)
  })

  grouped.forEach((dates, drug) => {
    const sorted = dates.sort((a, b) => a.getTime() - b.getTime())
    const thresholdMs = 30 * 24 * 60 * 60 * 1000
    const latest = sorted[sorted.length - 1]
    const recentCount = sorted.filter((date) => latest.getTime() - date.getTime() <= thresholdMs).length
    if (recentCount > 1) {
      flags.push({
        type: 'Rapid Repeat Prescription',
        explanation: `Controlled substance ${drug} prescribed ${recentCount} times within 30 days`,
        severity: 'HIGH',
        detectedBy: 'rule'
      })
    }
  })

  return flags
}

export function detectUnusualDosage(prescriptions: Prescription[]): FraudFlag[] {
  const flags: FraudFlag[] = []

  prescriptions.forEach((prescription) => {
    const drug = prescription.drugName.trim()
    const threshold = DOSAGE_THRESHOLDS[drug]
    if (!threshold) {
      return
    }
    const amount = parseMg(prescription.dosage)
    if (amount > threshold) {
      flags.push({
        type: 'Unusual Dosage',
        explanation: `${drug} dosage of ${amount}mg exceeds typical maximum of ${threshold}mg`,
        severity: 'MEDIUM',
        detectedBy: 'rule'
      })
    }
  })

  return flags
}

export function detectMultiplePrescribers(prescriptions: Prescription[]): FraudFlag | null {
  const prescribers = new Set<string>()
  prescriptions.forEach((prescription) => {
    prescribers.add(prescription.prescribedBy.trim())
  })

  if (prescribers.size > 3) {
    return {
      type: 'Multiple Prescribers',
      explanation: `More than 3 unique prescribers detected: ${Array.from(prescribers).join(', ')}`,
      severity: 'MEDIUM',
      detectedBy: 'rule'
    }
  }

  return null
}

export function runAllFraudRules(prescriptions: Prescription[]): FraudFlag[] {
  const flags: FraudFlag[] = []

  const doctorShopping = detectDoctorShopping(prescriptions)
  if (doctorShopping) {
    flags.push(doctorShopping)
  }

  flags.push(...detectDuplicateFill(prescriptions))
  flags.push(...detectRapidRepeat(prescriptions))
  flags.push(...detectUnusualDosage(prescriptions))

  const multiplePrescribers = detectMultiplePrescribers(prescriptions)
  if (multiplePrescribers) {
    flags.push(multiplePrescribers)
  }

  return flags
}

export function calculateRuleBasedScore(flags: FraudFlag[]): number {
  const score = flags.reduce((acc, flag) => {
    if (flag.severity === 'HIGH') return acc + 25
    if (flag.severity === 'MEDIUM') return acc + 15
    if (flag.severity === 'LOW') return acc + 5
    return acc
  }, 0)

  return Math.min(100, score)
}

export function combineFraudResults(ruleFlags: FraudFlag[], aiAnalysis: FraudAnalysis, ruleScore: number): FraudAnalysis {
  const combinedScore = Math.min(100, Math.max(ruleScore, aiAnalysis.fraudRiskScore))
  const aiFlags = aiAnalysis.flags.map((flag) => ({ ...flag, detectedBy: flag.detectedBy === 'rule' ? 'ai' : flag.detectedBy }))

  return {
    fraudRiskScore: combinedScore,
    flags: [...ruleFlags, ...aiFlags],
    summary: aiAnalysis.summary || `Combined rule-based and AI review produced ${ruleFlags.length} rule flags and ${aiFlags.length} AI flags.`,
    disclaimer: aiAnalysis.disclaimer || 'AI-generated pattern analysis for authorized review only. Not a legal determination.'
  }
}
