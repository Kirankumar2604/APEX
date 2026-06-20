'use client'

import { useState } from 'react'
import type { ConsentPurpose, ConsentScope, ConsentDuration } from '@/types'
import { getPatients } from '@/lib/mockData'

interface AccessRequestFormProps {
  requesterId: string
  requesterName: string
  requesterRole: string
  onSubmitted: () => void
}

export function AccessRequestForm({
  requesterId,
  requesterName,
  requesterRole,
  onSubmitted,
}: AccessRequestFormProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    purpose: 'Consultation' as ConsentPurpose,
    scope: 'Prescriptions Only' as ConsentScope,
    duration: '24 Hours' as ConsentDuration,
    message: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const patients = getPatients()

  const purposes: ConsentPurpose[] = [
    'Consultation',
    'Emergency',
    'Prescription Refill',
    'Insurance Claim',
    'Lab Review',
  ]

  const scopes: ConsentScope[] = [
    'Prescriptions Only',
    'Lab Reports Only',
    'Full Medical History',
    'Allergies Only',
  ]

  const durations: ConsentDuration[] = ['1 Hour', '24 Hours', '7 Days', 'One-Time']

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.patientId) {
      newErrors.patientId = 'Patient selection required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      // Here you would call submitAccessRequest from useConsent
      onSubmitted()
      setFormData({
        patientId: '',
        purpose: 'Consultation',
        scope: 'Prescriptions Only',
        duration: '24 Hours',
        message: '',
      })
    } catch (error) {
      console.error('Failed to submit request:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select Patient *
        </label>
        <select
          name="patientId"
          value={formData.patientId}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
        >
          <option value="">-- Choose a patient --</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name}
            </option>
          ))}
        </select>
        {errors.patientId && (
          <p className="text-xs text-red-400 mt-1">{errors.patientId}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Purpose of Access
        </label>
        <select
          name="purpose"
          value={formData.purpose}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
        >
          {purposes.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Data Scope
        </label>
        <select
          name="scope"
          value={formData.scope}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
        >
          {scopes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Access Duration
        </label>
        <select
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
        >
          {durations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Message (Optional)
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={3}
          placeholder="Explain why you need this data..."
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none resize-none"
        />
      </div>

      <div className="pt-4 border-t border-slate-700">
        <button
          type="submit"
          className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded transition-colors"
        >
          Submit Access Request
        </button>
      </div>
    </form>
  )
}
