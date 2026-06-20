import type { Prescription, FraudFlag, FraudAnalysis, RiskLevel } from '@/types'

const CONTROLLED_SUBSTANCES = [
  'Tramadol',
  'Alprazolam',
  'Diazepam',
  'Codeine',
  'Morphine',
  'Oxycodone',
  'Zolpidem',
  'Clonazepam',
  'Lorazepam',
  'Fentanyl',
]

export function runAllFraudRules(prescriptions: Prescription[]): FraudFlag[] {
  const flags: FraudFlag[] = []

  const doctorShoppingFlag = detectDoctorShopping(prescriptions)
  if (doctorShoppingFlag) {
    flags.push(doctorShoppingFlag)
  }

  const duplicateFillFlags = detectDuplicateFill(prescriptions)
  flags.push(...duplicateFillFlags)

  const rapidRepeatFlags = detectRapidRepeat(prescriptions)
  flags.push(...rapidRepeatFlags)

  const unusualDosageFlags = detectUnusualDosage(prescriptions)
  flags.push(...unusualDosageFlags)

  return flags
}

export function detectDoctorShopping(prescriptions: Prescription[]): FraudFlag | null {
  const drugCounts: { [drug: string]: Set<string> } = {}

  prescriptions.forEach((rx) => {
    if (!drugCounts[rx.drugName]) {
      drugCounts[rx.drugName] = new Set()
    }
    drugCounts[rx.drugName].add(rx.prescribedBy)
  })

  for (const [drug, doctors] of Object.entries(drugCounts)) {
    if (doctors.size >= 3) {
      return {
        type: 'Doctor Shopping',
        explanation: `Same medication "${drug}" prescribed by ${doctors.size} different doctors: ${Array.from(doctors).join(', ')}`,
        severity: 'HIGH',
        detectedBy: 'rule',
      }
    }
  }

  return null
}

export function detectDuplicateFill(prescriptions: Prescription[]): FraudFlag[] {
  const flags: FraudFlag[] = []
  const seen: { [key: string]: Prescription } = {}

  prescriptions.forEach((rx) => {
    const key = `${rx.drugName}_${rx.prescribedBy}`

    if (seen[key]) {
      const prev = seen[key]
      const daysDiff = Math.floor(
        (new Date(rx.prescribedDate).getTime() -
          new Date(prev.prescribedDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )

      if (daysDiff <= 7 && daysDiff > 0) {
        flags.push({
          type: 'Duplicate Fill',
          explanation: `Same medication "${rx.drugName}" prescribed by "${rx.prescribedBy}" only ${daysDiff} days apart (prescriptions on ${prev.prescribedDate} and ${rx.prescribedDate})`,
          severity: 'HIGH',
          detectedBy: 'rule',
        })
      }
    }

    seen[key] = rx
  })

  return flags
}

export function detectRapidRepeat(prescriptions: Prescription[]): FraudFlag[] {
  const flags: FraudFlag[] = []

  for (const substance of CONTROLLED_SUBSTANCES) {
    const substanceRxs = prescriptions.filter((rx) =>
      rx.drugName.includes(substance)
    )

    if (substanceRxs.length >= 2) {
      const dates = substanceRxs.map((rx) => new Date(rx.prescribedDate))
      const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())

      let hasRapidRepeat = false
      for (let i = 1; i < sortedDates.length; i++) {
        const daysDiff = Math.floor(
          (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) /
            (1000 * 60 * 60 * 24)
        )
        if (daysDiff <= 30 && daysDiff > 0) {
          hasRapidRepeat = true
          break
        }
      }

      if (hasRapidRepeat) {
        flags.push({
          type: 'Rapid Repeat - Controlled Substance',
          explanation: `Controlled substance "${substance}" prescribed ${substanceRxs.length} times within 30 days`,
          severity: 'HIGH',
          detectedBy: 'rule',
        })
      }
    }
  }

  return flags
}

export function detectUnusualDosage(prescriptions: Prescription[]): FraudFlag[] {
  const flags: FraudFlag[] = []

  const dosageThresholds: { [drug: string]: number } = {
    Tramadol: 400,
    Alprazolam: 4,
    Warfarin: 10,
    Morphine: 60,
    Oxycodone: 120,
  }

  prescriptions.forEach((rx) => {
    if (rx.drugName in dosageThresholds) {
      const dosageMatch = rx.dosage.match(/(\d+(?:\.\d+)?)/);
      if (dosageMatch) {
        const dosageValue = parseFloat(dosageMatch[1])
        const threshold = dosageThresholds[rx.drugName]

        if (dosageValue > threshold) {
          flags.push({
            type: 'Unusual Dosage',
            explanation: `Unusually high dosage of "${rx.drugName}": ${rx.dosage} (typical max: ${threshold}mg)`,
            severity: 'MEDIUM',
            detectedBy: 'rule',
          })
        }
      }
    }
  })

  return flags
}

export function calculateRuleBasedScore(flags: FraudFlag[]): number {
  let score = 0

  flags.forEach((flag) => {
    if (flag.severity === 'HIGH') {
      score += 25
    } else if (flag.severity === 'MEDIUM') {
      score += 15
    } else if (flag.severity === 'LOW') {
      score += 5
    }
  })

  return Math.min(score, 100)
}

export function combineFraudResults(
  ruleFlags: FraudFlag[],
  aiAnalysis: FraudAnalysis,
  ruleScore: number
): FraudAnalysis {
  // Combine rule flags with AI flags
  const allFlags = [...ruleFlags, ...aiAnalysis.flags]

  // Average the scores, weighted towards AI if present
  const combinedScore = aiAnalysis.fraudRiskScore > 0
    ? (ruleScore * 0.3 + aiAnalysis.fraudRiskScore * 0.7)
    : ruleScore

  return {
    fraudRiskScore: Math.round(combinedScore),
    flags: allFlags,
    summary:
      ruleScore > 70 || aiAnalysis.fraudRiskScore > 70
        ? 'HIGH FRAUD RISK - Immediate physician review recommended'
        : ruleScore > 40 || aiAnalysis.fraudRiskScore > 40
          ? 'MEDIUM FRAUD RISK - Additional verification recommended'
          : 'LOW FRAUD RISK - Standard monitoring sufficient',
    disclaimer:
      'Fraud detection is AI-assisted. All alerts must be reviewed by qualified healthcare professionals.',
  }
}
