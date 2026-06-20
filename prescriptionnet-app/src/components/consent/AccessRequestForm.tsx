'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Search } from 'lucide-react'
import type { ConsentDuration, ConsentPurpose, ConsentScope } from '@/types'
import { getPatients, getUserById } from '@/lib/mockData'
import { useConsent } from '@/hooks/useConsent'

interface AccessRequestFormProps {
  requesterId: string
  requesterName: string
  requesterRole: string
  initialPatientId?: string
  onSubmitted: () => void
}

const PURPOSES: ConsentPurpose[] = [
  'Consultation',
  'Emergency',
  'Prescription Refill',
  'Insurance Claim',
  'Lab Review',
]

const SCOPES: ConsentScope[] = [
  'Prescriptions Only',
  'Lab Reports Only',
  'Full Medical History',
  'Allergies Only',
]

const DURATIONS: ConsentDuration[] = ['1 Hour', '24 Hours', '7 Days', 'One-Time']

export function AccessRequestForm({
  requesterId,
  requesterName,
  requesterRole,
  initialPatientId = '',
  onSubmitted,
}: AccessRequestFormProps) {
  const { submitRequest } = useConsent(undefined, requesterId)
  const patients = useMemo(() => getPatients(), [])
  const [formData, setFormData] = useState({
    patientId: initialPatientId,
    purpose: 'Consultation' as ConsentPurpose,
    scope: 'Prescriptions Only' as ConsentScope,
    duration: '24 Hours' as ConsentDuration,
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (initialPatientId) {
      setFormData((prev) => ({ ...prev, patientId: initialPatientId }))
    }
  }, [initialPatientId])

  const selectedPatient = getUserById(formData.patientId)

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
    setSuccessMessage('')
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    const patient = getUserById(formData.patientId)

    if (!formData.patientId) {
      nextErrors.patientId = 'Patient ID is required'
    } else if (!patient || patient.role !== 'patient') {
      nextErrors.patientId = 'Patient must exist in the registry'
    }

    if (!formData.purpose) nextErrors.purpose = 'Purpose is required'
    if (!formData.scope) nextErrors.scope = 'Scope is required'
    if (!formData.duration) nextErrors.duration = 'Duration is required'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    submitRequest({
      requesterId,
      requesterName,
      requesterRole,
      patientId: formData.patientId,
      purpose: formData.purpose,
      scope: formData.scope,
      duration: formData.duration,
      message: formData.message.trim() || undefined,
    })

    setSuccessMessage('Request submitted. Waiting for patient authorization.')
    setFormData({
      patientId: '',
      purpose: 'Consultation',
      scope: 'Prescriptions Only',
      duration: '24 Hours',
      message: '',
    })
    setErrors({})
    onSubmitted()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200">Patient ID *</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            name="patientId"
            value={formData.patientId}
            onChange={handleChange}
            list="patient-options"
            placeholder="patient-001"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-10 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
          />
        </div>
        <datalist id="patient-options">
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name}
            </option>
          ))}
        </datalist>
        {errors.patientId ? (
          <p className="text-xs text-red-400">{errors.patientId}</p>
        ) : selectedPatient ? (
          <p className="text-xs text-emerald-300">
            {selectedPatient.name} verified
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field
          label="Purpose *"
          name="purpose"
          value={formData.purpose}
          error={errors.purpose}
          onChange={handleChange}
          options={PURPOSES}
        />
        <Field
          label="Data Scope *"
          name="scope"
          value={formData.scope}
          error={errors.scope}
          onChange={handleChange}
          options={SCOPES}
        />
        <Field
          label="Duration *"
          name="duration"
          value={formData.duration}
          error={errors.duration}
          onChange={handleChange}
          options={DURATIONS}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200">Message (Optional)</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          placeholder="Reason for access request (optional)"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
        />
      </div>

      {successMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
      >
        Submit Access Request
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  value,
  error,
  onChange,
  options,
}: {
  label: string
  name: string
  value: string
  error?: string
  onChange: React.ChangeEventHandler<HTMLSelectElement>
  options: string[]
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-200">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
