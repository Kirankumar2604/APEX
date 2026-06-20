'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AccessRequest, Consent } from '@/types'
import * as consent from '@/lib/consent'

export function useConsent(
  patientId?: string,
  requesterId?: string
) {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [consents, setConsents] = useState<Consent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshAll = useCallback(() => {
    consent.checkAndExpireConsents()
    setRequests(consent.getAccessRequests(patientId, requesterId))
    setConsents(patientId ? consent.getConsents(patientId, requesterId) : [])
    setIsLoading(false)
  }, [patientId, requesterId])

  useEffect(() => {
    refreshAll()
    const interval = window.setInterval(() => {
      refreshAll()
    }, 60000)

    return () => window.clearInterval(interval)
  }, [refreshAll])

  const submitRequest = useCallback(
    (request: Omit<AccessRequest, 'id' | 'status' | 'requestedAt'>) => {
      const newRequest = consent.submitAccessRequest(request)
      refreshAll()
      return newRequest
    },
    [refreshAll]
  )

  const approveRequest = useCallback(
    (
      request: AccessRequest,
      signature: string,
      sessionKeyEncrypted: string = 'simulated-session-key'
    ) => {
      const newConsent = consent.createConsent(request, signature, sessionKeyEncrypted)
      refreshAll()
      return newConsent
    },
    [refreshAll]
  )

  const denyRequest = useCallback(
    (requestId: string) => {
      if (!patientId) return
      consent.denyRequest(requestId, patientId)
      refreshAll()
    },
    [patientId, refreshAll]
  )

  const revokeConsent = useCallback(
    (consentId: string) => {
      if (!patientId) return
      consent.revokeConsent(consentId, patientId)
      refreshAll()
    },
    [patientId, refreshAll]
  )

  const pendingRequests = requests.filter((request) => request.status === 'pending')
  const activeConsents = consents.filter((consentEntry) => consentEntry.status === 'active')
  const stats = patientId ? consent.getConsentStats(patientId) : null

  return {
    requests,
    consents,
    pendingRequests,
    activeConsents,
    isLoading,
    stats,
    submitRequest,
    approveRequest,
    denyRequest,
    revokeConsent,
    refreshAll,
  }
}
