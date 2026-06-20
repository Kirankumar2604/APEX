'use client'

import { useState } from 'react'
import {
  generateAndStoreKeyPair,
  getECDSAPrivateKey,
  getECDSAPublicKey,
} from '@/lib/keystore'
import {
  signConsentAuthorization,
  verifyConsentSignature,
  encryptData,
  decryptData,
  generateAESKey,
} from '@/lib/crypto'
import { createSecureSession, accessSecureSession } from '@/lib/session'

export function useCrypto() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializeKeyPair = async (userId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await generateAndStoreKeyPair(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize keypair')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const signConsent = async (patientId: string, consentData: object): Promise<string> => {
    setIsLoading(true)
    setError(null)
    try {
      const privateKey = await getECDSAPrivateKey(patientId)
      return await signConsentAuthorization(privateKey, consentData)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to sign consent'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const verifyConsent = async (
    patientId: string,
    signature: string,
    consentData: object
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const publicKey = await getECDSAPublicKey(patientId)
      return await verifyConsentSignature(publicKey, signature, consentData)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to verify consent'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const encryptVaultData = async (
    data: object,
    password: string,
    salt: string
  ): Promise<{ encrypted: string; iv: string }> => {
    setIsLoading(true)
    setError(null)
    try {
      const key = await generateAESKey()
      const dataString = JSON.stringify(data)
      return await encryptData(key, dataString)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to encrypt data'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const decryptVaultData = async (
    encrypted: string,
    iv: string,
    password: string,
    salt: string
  ): Promise<object> => {
    setIsLoading(true)
    setError(null)
    try {
      const key = await generateAESKey()
      const decrypted = await decryptData(key, encrypted, iv)
      return JSON.parse(decrypted)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to decrypt data'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const createSession = async (
    consentId: string,
    patientId: string,
    requesterId: string,
    data: object,
    expiresAt: string
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      return await createSecureSession(consentId, patientId, requesterId, data, expiresAt)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create session'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const accessSession = async (
    sessionId: string,
    requesterId: string
  ): Promise<object | null> => {
    setIsLoading(true)
    setError(null)
    try {
      return await accessSecureSession(sessionId, requesterId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to access session'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    initializeKeyPair,
    signConsent,
    verifyConsent,
    encryptVaultData,
    decryptVaultData,
    createSession,
    accessSession,
  }
}
