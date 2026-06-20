'use client'

import { useEffect, useState } from 'react'
import type { LabReport, Prescription } from '@/types'
import Modal from '@/components/ui/Modal'
import { useVault } from '@/hooks/useVault'

interface AddRecordModalProps {
  patientId: string
  type: 'prescription' | 'lab'
  isOpen: boolean
  onClose: () => void
  onAdded: () => void
}

type PrescriptionFormState = Omit<Prescription, 'id' | 'patientId'>

type LabFormState = Omit<LabReport, 'id' | 'patientId'>

export function AddRecordModal({
  patientId,
  type,
  isOpen,
  onClose,
  onAdded,
}: AddRecordModalProps) {
  const { addPrescription, addLabReport } = useVault(patientId)
  const [submitError, setSubmitError] = useState('')
  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionFormState>({
    drugName: '',
    dosage: '',
    frequency: '',
    prescribedBy: '',
    prescribedDate: '',
    expiryDate: '',
    isActive: true,
  })
  const [labForm, setLabForm] = useState<LabFormState>({
    testName: '',
    result: '',
    referenceRange: '',
    isAbnormal: false,
    conductedDate: '',
    conductedBy: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return
    setSubmitError('')
    setErrors({})
    setPrescriptionForm({
      drugName: '',
      dosage: '',
      frequency: '',
      prescribedBy: '',
      prescribedDate: '',
      expiryDate: '',
      isActive: true,
    })
    setLabForm({
      testName: '',
      result: '',
      referenceRange: '',
      isAbnormal: false,
      conductedDate: '',
      conductedBy: '',
    })
  }, [isOpen, type])

  const validatePrescription = () => {
    const nextErrors: Record<string, string> = {}
    if (!prescriptionForm.drugName.trim()) nextErrors.drugName = 'Drug name is required'
    if (!prescriptionForm.dosage.trim()) nextErrors.dosage = 'Dosage is required'
    if (!prescriptionForm.frequency.trim()) nextErrors.frequency = 'Frequency is required'
    if (!prescriptionForm.prescribedBy.trim()) nextErrors.prescribedBy = 'Prescriber is required'
    if (!prescriptionForm.prescribedDate) nextErrors.prescribedDate = 'Prescribed date is required'
    if (!prescriptionForm.expiryDate) nextErrors.expiryDate = 'Expiry date is required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateLab = () => {
    const nextErrors: Record<string, string> = {}
    if (!labForm.testName.trim()) nextErrors.testName = 'Test name is required'
    if (!labForm.result.trim()) nextErrors.result = 'Result is required'
    if (!labForm.referenceRange.trim()) nextErrors.referenceRange = 'Reference range is required'
    if (!labForm.conductedDate) nextErrors.conductedDate = 'Conducted date is required'
    if (!labForm.conductedBy.trim()) nextErrors.conductedBy = 'Lab or doctor name is required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const resetAndClose = () => {
    onAdded()
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')

    try {
      if (type === 'prescription') {
        if (!validatePrescription()) return
        await addPrescription(prescriptionForm)
      } else {
        if (!validateLab()) return
        await addLabReport(labForm)
      }
      resetAndClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save record')
    }
  }

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="add-record-form"
        className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
      >
        {type === 'prescription' ? 'Add Prescription' : 'Add Lab Report'}
      </button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'prescription' ? 'Add Prescription' : 'Add Lab Report'}
      footer={footer}
      maxWidth="720px"
    >
      <form id="add-record-form" onSubmit={handleSubmit} className="space-y-4">
        {type === 'prescription' ? (
          <PrescriptionFields
            value={prescriptionForm}
            errors={errors}
            onChange={setPrescriptionForm}
          />
        ) : (
          <LabFields value={labForm} errors={errors} onChange={setLabForm} />
        )}
        {submitError ? (
          <p className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            {submitError}
          </p>
        ) : null}
      </form>
    </Modal>
  )
}

function PrescriptionFields({
  value,
  errors,
  onChange,
}: {
  value: PrescriptionFormState
  errors: Record<string, string>
  onChange: React.Dispatch<React.SetStateAction<PrescriptionFormState>>
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Drug Name" value={value.drugName} error={errors.drugName} onChange={(drugName) => onChange((current) => ({ ...current, drugName }))} />
      <TextField label="Dosage" value={value.dosage} error={errors.dosage} onChange={(dosage) => onChange((current) => ({ ...current, dosage }))} />
      <TextField label="Frequency" value={value.frequency} error={errors.frequency} onChange={(frequency) => onChange((current) => ({ ...current, frequency }))} />
      <TextField label="Prescribed By" value={value.prescribedBy} error={errors.prescribedBy} onChange={(prescribedBy) => onChange((current) => ({ ...current, prescribedBy }))} />
      <DateField label="Prescribed Date" value={value.prescribedDate} error={errors.prescribedDate} onChange={(prescribedDate) => onChange((current) => ({ ...current, prescribedDate }))} />
      <DateField label="Expiry Date" value={value.expiryDate} error={errors.expiryDate} onChange={(expiryDate) => onChange((current) => ({ ...current, expiryDate }))} />
      <ToggleField
        label="Is Active"
        value={value.isActive}
        onChange={(isActive) => onChange((current) => ({ ...current, isActive }))}
      />
    </div>
  )
}

function LabFields({
  value,
  errors,
  onChange,
}: {
  value: LabFormState
  errors: Record<string, string>
  onChange: React.Dispatch<React.SetStateAction<LabFormState>>
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Test Name" value={value.testName} error={errors.testName} onChange={(testName) => onChange((current) => ({ ...current, testName }))} />
      <TextField label="Result" value={value.result} error={errors.result} onChange={(result) => onChange((current) => ({ ...current, result }))} />
      <TextField label="Reference Range" value={value.referenceRange} error={errors.referenceRange} onChange={(referenceRange) => onChange((current) => ({ ...current, referenceRange }))} />
      <DateField label="Conducted Date" value={value.conductedDate} error={errors.conductedDate} onChange={(conductedDate) => onChange((current) => ({ ...current, conductedDate }))} />
      <TextField label="Conducted By" value={value.conductedBy} error={errors.conductedBy} onChange={(conductedBy) => onChange((current) => ({ ...current, conductedBy }))} />
      <ToggleField
        label="Is Abnormal"
        value={value.isAbnormal}
        onChange={(isAbnormal) => onChange((current) => ({ ...current, isAbnormal }))}
      />
    </div>
  )
}

function TextField({
  label,
  value,
  error,
  onChange,
}: {
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-slate-200">{label} *</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
      />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </label>
  )
}

function DateField({
  label,
  value,
  error,
  onChange,
}: {
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-slate-200">{label} *</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
      />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </label>
  )
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
          value ? 'border-emerald-500/40 bg-emerald-500' : 'border-slate-600 bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
