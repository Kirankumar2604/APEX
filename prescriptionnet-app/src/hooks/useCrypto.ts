<<<<<<< HEAD
/**
 * React Hook for Cryptographic Operations
 * Wraps all crypto operations for use in components
 */

'use client'

import { useState, useCallback } from 'react'
import * as crypto from '@/lib/crypto'
import * as keystore from '@/lib/keystore'
import * as session from '@/lib/session'

interface CryptoState {
  isLoading: boolean
  error: string | null
  lastSignature: string | null
  lastVerification: boolean | null
}

export function useCrypto() {
  const [state, setState] = useState<CryptoState>({
    isLoading: false,
    error: null,
    lastSignature: null,
    lastVerification: null,
  })

  /**
   * Initialize keypair for a new user
   */
  const initializeKeyPair = useCallback(async (userId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const publicKeys = await keystore.generateAndStoreKeyPair(userId)
      setState(prev => ({ ...prev, isLoading: false }))
      return publicKeys
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize keypair'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      throw error
    }
  }, [])

  /**
   * Sign a consent authorization
   */
  const signConsent = useCallback(async (
    patientId: string,
    consentData: {
      requestId: string
      patientId: string
      requesterId: string
      scope: string
      purpose: string
      duration: string
      timestamp: string
    }
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      // Get patient ECDSA private key from keystore
      const privateKey = await keystore.getECDSAPrivateKey(patientId)
      
      // Sign consent authorization
      const signature = await crypto.signConsentAuthorization(privateKey, consentData)
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastSignature: signature,
      }))
      
      return signature
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign consent'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      throw error
    }
  }, [])

  /**
   * Verify a consent signature
   */
  const verifyConsent = useCallback(async (
    patientId: string,
    signature: string,
    consentData: {
      requestId: string
      patientId: string
      requesterId: string
      scope: string
      purpose: string
      duration: string
      timestamp: string
    }
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      // Get patient ECDSA public key
      const publicKey = await keystore.getECDSAPublicKey(patientId)
      
      // Verify signature
      const isValid = await crypto.verifyConsentSignature(publicKey, signature, consentData)
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastVerification: isValid,
      }))
      
      return isValid
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify consent'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        lastVerification: false,
      }))
      return false
    }
  }, [])

  /**
   * Encrypt vault data with password
   */
  const encryptVaultData = useCallback(async (
    data: object,
    password: string,
    userId: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      // Get or generate salt for user
      let salt = localStorage.getItem(`vault_salt_${userId}`)
      if (!salt) {
        salt = await crypto.generateSalt()
        localStorage.setItem(`vault_salt_${userId}`, salt)
      }
      
      // Derive key from password
      const key = await crypto.deriveKeyFromPassword(password, salt)
      
      // Encrypt data
      const dataString = JSON.stringify(data)
      const { encrypted, iv } = await crypto.encryptData(key, dataString)
      
      setState(prev => ({ ...prev, isLoading: false }))
      
      return { encrypted, iv, salt }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to encrypt vault data'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      throw error
    }
  }, [])

  /**
   * Decrypt vault data with password
   */
  const decryptVaultData = useCallback(async (
=======
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
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
    encrypted: string,
    iv: string,
    password: string,
    salt: string
<<<<<<< HEAD
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      // Derive key from password
      const key = await crypto.deriveKeyFromPassword(password, salt)
      
      // Decrypt data
      const decryptedString = await crypto.decryptData(key, encrypted, iv)
      const data = JSON.parse(decryptedString)
      
      setState(prev => ({ ...prev, isLoading: false }))
      
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to decrypt vault data'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      throw error
    }
  }, [])

  /**
   * Create secure session when consent is approved
   */
  const createSession = useCallback(async (
    consentId: string,
    patientId: string,
    requesterId: string,
    patientData: object,
    expiresAt: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const sessionDetails = await session.createSecureSession(
        consentId,
        patientId,
        requesterId,
        patientData,
        expiresAt
      )
      
      setState(prev => ({ ...prev, isLoading: false }))
      
      return sessionDetails
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      throw error
    }
  }, [])

  /**
   * Access session data (called by doctor/requester)
   */
  const accessSession = useCallback(async (
    sessionId: string,
    requesterId: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const data = await session.accessSecureSession(sessionId, requesterId)
      
      setState(prev => ({ ...prev, isLoading: false }))
      
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access session'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return null
    }
  }, [])

  /**
   * Sign arbitrary data
   */
  const signData = useCallback(async (
    userId: string,
    data: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const privateKey = await keystore.getECDSAPrivateKey(userId)
      const signature = await crypto.signData(privateKey, data)
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastSignature: signature,
      }))
      
      return signature
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign data'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      throw error
    }
  }, [])

  /**
   * Verify arbitrary signature
   */
  const verifySignature = useCallback(async (
    userId: string,
    signature: string,
    data: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const publicKey = await keystore.getECDSAPublicKey(userId)
      const isValid = await crypto.verifySignature(publicKey, signature, data)
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastVerification: isValid,
      }))
      
      return isValid
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify signature'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        lastVerification: false,
      }))
      return false
    }
  }, [])

  /**
   * Hash data using SHA-256
   */
  const hashData = useCallback(async (data: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const hash = await crypto.sha256Hash(data)
      setState(prev => ({ ...prev, isLoading: false }))
      return hash
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to hash data'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      throw error
    }
  }, [])

  /**
   * Check if user has keypair
   */
  const hasKeyPair = useCallback((userId: string) => {
    return keystore.hasKeyPair(userId)
  }, [])

  /**
   * Get public keys for user
   */
  const getPublicKeys = useCallback((userId: string) => {
    return keystore.getPublicKeys(userId)
  }, [])

  /**
   * Rotate keypair
   */
  const rotateKeyPair = useCallback(async (userId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const publicKeys = await keystore.rotateKeyPair(userId)
      setState(prev => ({ ...prev, isLoading: false }))
      return publicKeys
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rotate keypair'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      throw error
    }
  }, [])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  /**
   * Get session stats
   */
  const getSessionStats = useCallback(() => {
    return session.getSessionStats()
  }, [])

  /**
   * Expire session
   */
  const expireSession = useCallback((sessionId: string) => {
    session.expireSession(sessionId)
  }, [])

  /**
   * Check and expire old sessions
   */
  const checkAndExpireOldSessions = useCallback(() => {
    session.checkAndExpireOldSessions()
  }, [])

  return {
    // State
    ...state,
    
    // Keypair operations
    initializeKeyPair,
    hasKeyPair,
    getPublicKeys,
    rotateKeyPair,
    
    // Signature operations
    signConsent,
    verifyConsent,
    signData,
    verifySignature,
    
    // Vault encryption
    encryptVaultData,
    decryptVaultData,
    
    // Session operations
    createSession,
    accessSession,
    getSessionStats,
    expireSession,
    checkAndExpireOldSessions,
    
    // Utility
    hashData,
    clearError,
  }
}

// Made with Bob
=======
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
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
