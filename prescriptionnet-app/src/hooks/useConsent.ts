'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AccessRequest, Consent, ConsentPurpose, ConsentScope, ConsentDuration } from '@/types'
import {
  getAccessRequests,
  getPendingRequests,
  submitAccessRequest,
  getConsents,
  getActiveConsents,
  revokeConsent,
  checkAndExpireConsents,
  getConsentStats,
} from '@/lib/consent'

export function useConsent(patientId?: string, requesterId?: string) {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [consents, setConsents] = useState<Consent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    activeConsents: 0,
    revokedConsents: 0,
    expiredConsents: 0,
  })

  const refreshAll = useCallback(() => {
    try {
      setIsLoading(true)
      const allRequests = getAccessRequests(patientId, requesterId)
      const allConsents = getConsents(patientId, requesterId)

      setRequests(allRequests)
      setConsents(allConsents)

      if (patientId) {
        setStats(getConsentStats(patientId))
      }
    } catch (error) {
      console.error('Failed to refresh consent data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [patientId, requesterId])

  useEffect(() => {
    refreshAll()

    // Check and expire consents every 60 seconds
    const interval = setInterval(() => {
      checkAndExpireConsents()
      refreshAll()
    }, 60000)

    return () => clearInterval(interval)
  }, [refreshAll])

  const handleSubmitRequest = useCallback(
    (
      requestIdParam: string,
      requesterName: string,
      requesterRole: string,
      purpose: ConsentPurpose,
      scope: ConsentScope,
      duration: ConsentDuration,
      message?: string
    ) => {
      if (!patientId) return

      try {
        submitAccessRequest({
          requesterId: requestIdParam,
          requesterName,
          requesterRole,
          patientId,
          purpose,
          scope,
          duration,
          message,
        })
        refreshAll()
      } catch (error) {
        console.error('Failed to submit access request:', error)
      }
    },
    [patientId, refreshAll]
  )

  const handleApproveRequest = useCallback(
    (requestId: string, signature: string, sessionKeyEncrypted: string) => {
      try {
        const request = requests.find((r) => r.id === requestId)
        if (request) {
          // This would normally be called from patientAuthorizeAccess in cryptoIntegration
          refreshAll()
        }
      } catch (error) {
        console.error('Failed to approve request:', error)
      }
    },
    [requests, refreshAll]
  )

  const handleDenyRequest = useCallback(
    (requestId: string) => {
      try {
        const request = requests.find((r) => r.id === requestId)
        if (request && patientId) {
          // Deny request logic would go here
          refreshAll()
        }
      } catch (error) {
        console.error('Failed to deny request:', error)
      }
    },
    [requests, patientId, refreshAll]
  )

  const handleRevokeConsent = useCallback(
    (consentId: string) => {
      if (!patientId) return

      try {
        revokeConsent(consentId, patientId)
        refreshAll()
      } catch (error) {
        console.error('Failed to revoke consent:', error)
      }
    },
    [patientId, refreshAll]
  )

  const pendingRequests = patientId ? getPendingRequests(patientId) : []
  const activeConsents = patientId ? getActiveConsents(patientId) : []

  return {
    requests,
    consents,
    isLoading,
    stats,
    pendingRequests,
    activeConsents,
    submitRequest: handleSubmitRequest,
    approveRequest: handleApproveRequest,
    denyRequest: handleDenyRequest,
    revokeConsent: handleRevokeConsent,
    refreshAll,
  }
}
