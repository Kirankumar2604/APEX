'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { Prescription, LabReport } from '@/types'

interface AddRecordModalProps {
  patientId: string
  type: 'prescription' | 'lab'
  isOpen: boolean
  onClose: () => void
  onAdded: () => void
}

export function AddRecordModal({
  patientId,
  type,
  isOpen,
  onClose,
  onAdded,
}: AddRecordModalProps) {
  const [formData, setFormData] = useState<any>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (type === 'prescription') {
      if (!formData.drugName?.trim()) newErrors.drugName = 'Drug name required'
      if (!formData.dosage?.trim()) newErrors.dosage = 'Dosage required'
      if (!formData.frequency?.trim()) newErrors.frequency = 'Frequency required'
      if (!formData.prescribedBy?.trim()) newErrors.prescribedBy = 'Prescriber name required'
      if (!formData.prescribedDate) newErrors.prescribedDate = 'Prescribed date required'
      if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date required'
    } else {
      if (!formData.testName?.trim()) newErrors.testName = 'Test name required'
      if (!formData.result?.trim()) newErrors.result = 'Result required'
      if (!formData.referenceRange?.trim()) newErrors.referenceRange = 'Reference range required'
      if (!formData.conductedDate) newErrors.conductedDate = 'Test date required'
      if (!formData.conductedBy?.trim()) newErrors.conductedBy = 'Lab name required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      if (type === 'prescription') {
        // Would call useVault hook here
        onAdded()
      } else {
        // Would call useVault hook here
        onAdded()
      }
      setFormData({})
      onClose()
    } catch (error) {
      console.error('Failed to add record:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg border border-cyan-500/30 p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-cyan-100">
            Add {type === 'prescription' ? 'Prescription' : 'Lab Report'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'prescription' ? (
            <>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Drug Name *</label>
                <input
                  type="text"
                  name="drugName"
                  value={formData.drugName || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
                  placeholder="e.g., Metformin"
                />
                {errors.drugName && <p className="text-xs text-red-400 mt-1">{errors.drugName}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Dosage *</label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
                  placeholder="e.g., 500mg"
                />
                {errors.dosage && <p className="text-xs text-red-400 mt-1">{errors.dosage}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Frequency *</label>
                <input
                  type="text"
                  name="frequency"
                  value={formData.frequency || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
                  placeholder="e.g., Twice daily"
                />
                {errors.frequency && <p className="text-xs text-red-400 mt-1">{errors.frequency}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Prescriber *</label>
                <input
                  type="text"
                  name="prescribedBy"
                  value={formData.prescribedBy || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
                  placeholder="e.g., Dr. Smith"
                />
                {errors.prescribedBy && <p className="text-xs text-red-400 mt-1">{errors.prescribedBy}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Prescribed Date *</label>
                <input
                  type="date"
                  name="prescribedDate"
                  value={formData.prescribedDate || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
                />
                {errors.prescribedDate && <p className="text-xs text-red-400 mt-1">{errors.prescribedDate}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Expiry Date *</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
                />
                {errors.expiryDate && <p className="text-xs text-red-400 mt-1">{errors.expiryDate}</p>}
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Test Name *</label>
                <input
                  type="text"
                  name="testName"
                  value={formData.testName || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
                  placeholder="e.g., HbA1c"
                />
                {errors.testName && <p className="text-xs text-red-400 mt-1">{errors.testName}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Result *</label>
                <input
                  type="text"
                  name="result"
                  value={formData.result || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
                  placeholder="e.g., 7.8%"
                />
                {errors.result && <p className="text-xs text-red-400 mt-1">{errors.result}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Reference Range *</label>
                <input
                  type="text"
                  name="referenceRange"
                  value={formData.referenceRange || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
                  placeholder="e.g., Below 7.0%"
                />
                {errors.referenceRange && <p className="text-xs text-red-400 mt-1">{errors.referenceRange}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Test Date *</label>
                <input
                  type="date"
                  name="conductedDate"
                  value={formData.conductedDate || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
                />
                {errors.conductedDate && <p className="text-xs text-red-400 mt-1">{errors.conductedDate}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Lab Name *</label>
                <input
                  type="text"
                  name="conductedBy"
                  value={formData.conductedBy || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-500 outline-none"
                  placeholder="e.g., Metropolis Labs"
                />
                {errors.conductedBy && <p className="text-xs text-red-400 mt-1">{errors.conductedBy}</p>}
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-slate-100 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded transition-colors"
            >
              Add Record
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
