<<<<<<< HEAD
/**
 * PrescriptionNet — Cryptographic Keystore
 * Manages ECDSA + ECDH key pairs in localStorage
 */

=======
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
import {
  generateECDSAKeyPair,
  generateECDHKeyPair,
  exportPublicKeyToJWK,
  exportPrivateKeyToJWK,
  importECDSAPublicKey,
  importECDSAPrivateKey,
  importECDHPublicKey,
  importECDHPrivateKey,
<<<<<<< HEAD
} from '@/lib/crypto'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface StoredKeyPair {
  ecdsaPublicKey: string   // JWK JSON string
  ecdsaPrivateKey: string  // JWK JSON string
  ecdhPublicKey: string    // JWK JSON string
  ecdhPrivateKey: string   // JWK JSON string
=======
  sha256Hash,
} from './crypto'

interface StoredKeyPair {
  ecdsaPublicKey: string
  ecdsaPrivateKey: string
  ecdhPublicKey: string
  ecdhPrivateKey: string
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
  userId: string
  createdAt: string
}

<<<<<<< HEAD
// ═══════════════════════════════════════════════════════
// KEY GENERATION & STORAGE
// ═══════════════════════════════════════════════════════

/**
 * Generate ECDSA + ECDH key pairs, store all 4 keys in localStorage,
 * and return the two PUBLIC key JWK strings.
 */
export async function generateAndStoreKeyPair(
  userId: string
): Promise<{ ecdsaPublicKeyJWK: string; ecdhPublicKeyJWK: string }> {
  try {
    // Generate both key pairs
    const ecdsaKeyPair = await generateECDSAKeyPair()
    const ecdhKeyPair = await generateECDHKeyPair()

    // Export all keys to JWK strings
    const ecdsaPublicKeyJWK = await exportPublicKeyToJWK(ecdsaKeyPair.publicKey)
    const ecdsaPrivateKeyJWK = await exportPrivateKeyToJWK(ecdsaKeyPair.privateKey)
    const ecdhPublicKeyJWK = await exportPublicKeyToJWK(ecdhKeyPair.publicKey)
    const ecdhPrivateKeyJWK = await exportPrivateKeyToJWK(ecdhKeyPair.privateKey)

    // Build stored structure
    const stored: StoredKeyPair = {
=======
export async function generateAndStoreKeyPair(userId: string): Promise<{
  ecdsaPublicKeyJWK: string
  ecdhPublicKeyJWK: string
}> {
  if (typeof window === 'undefined') {
    throw new Error('Keystore requires browser context')
  }

  try {
    // Check if already exists
    if (hasKeyPair(userId)) {
      const stored = getStoredKeyPair(userId)
      if (stored) {
        return {
          ecdsaPublicKeyJWK: stored.ecdsaPublicKey,
          ecdhPublicKeyJWK: stored.ecdhPublicKey,
        }
      }
    }

    // Generate ECDSA keys
    const ecdsaKeyPair = await generateECDSAKeyPair()
    const ecdsaPublicKeyJWK = await exportPublicKeyToJWK(ecdsaKeyPair.publicKey)
    const ecdsaPrivateKeyJWK = await exportPrivateKeyToJWK(ecdsaKeyPair.privateKey)

    // Generate ECDH keys
    const ecdhKeyPair = await generateECDHKeyPair()
    const ecdhPublicKeyJWK = await exportPublicKeyToJWK(ecdhKeyPair.publicKey)
    const ecdhPrivateKeyJWK = await exportPrivateKeyToJWK(ecdhKeyPair.privateKey)

    // Store
    const storedKeyPair: StoredKeyPair = {
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
      ecdsaPublicKey: ecdsaPublicKeyJWK,
      ecdsaPrivateKey: ecdsaPrivateKeyJWK,
      ecdhPublicKey: ecdhPublicKeyJWK,
      ecdhPrivateKey: ecdhPrivateKeyJWK,
      userId,
      createdAt: new Date().toISOString(),
    }

<<<<<<< HEAD
    // Persist to localStorage
    localStorage.setItem(`keypair_${userId}`, JSON.stringify(stored))

    // Also update the users array with the ECDSA public key
    const users = JSON.parse(localStorage.getItem('prescriptionnet_users') || '[]')
    const idx = users.findIndex((u: { id: string }) => u.id === userId)
    if (idx !== -1) {
      users[idx].publicKey = ecdsaPublicKeyJWK
      localStorage.setItem('prescriptionnet_users', JSON.stringify(users))
    }

    return { ecdsaPublicKeyJWK, ecdhPublicKeyJWK }
  } catch (error) {
    throw new Error(
      `Key pair generation & storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ═══════════════════════════════════════════════════════
// KEY RETRIEVAL (import from localStorage)
// ═══════════════════════════════════════════════════════

/** Retrieve and import the user's ECDSA private key */
export async function getECDSAPrivateKey(userId: string): Promise<CryptoKey> {
  try {
    const stored = getStoredKeyPair(userId)
    if (!stored) throw new Error(`No key pair found for user ${userId}`)
    return await importECDSAPrivateKey(stored.ecdsaPrivateKey)
  } catch (error) {
    throw new Error(
      `ECDSA private key retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Retrieve and import the user's ECDSA public key */
export async function getECDSAPublicKey(userId: string): Promise<CryptoKey> {
  try {
    const stored = getStoredKeyPair(userId)
    if (!stored) throw new Error(`No key pair found for user ${userId}`)
    return await importECDSAPublicKey(stored.ecdsaPublicKey)
  } catch (error) {
    throw new Error(
      `ECDSA public key retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Retrieve and import the user's ECDH private key */
export async function getECDHPrivateKey(userId: string): Promise<CryptoKey> {
  try {
    const stored = getStoredKeyPair(userId)
    if (!stored) throw new Error(`No key pair found for user ${userId}`)
    return await importECDHPrivateKey(stored.ecdhPrivateKey)
  } catch (error) {
    throw new Error(
      `ECDH private key retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Retrieve and import the user's ECDH public key */
export async function getECDHPublicKey(userId: string): Promise<CryptoKey> {
  try {
    const stored = getStoredKeyPair(userId)
    if (!stored) throw new Error(`No key pair found for user ${userId}`)
    return await importECDHPublicKey(stored.ecdhPublicKey)
  } catch (error) {
    throw new Error(
      `ECDH public key retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ═══════════════════════════════════════════════════════
// KEY INSPECTION & MANAGEMENT
// ═══════════════════════════════════════════════════════

/** Check if a user has a stored key pair */
export function hasKeyPair(userId: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(`keypair_${userId}`) !== null
}

/** Get the raw stored key pair (JWK strings, not CryptoKey objects) */
export function getStoredKeyPair(userId: string): StoredKeyPair | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(`keypair_${userId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredKeyPair
  } catch {
=======
    localStorage.setItem(`keypair_${userId}`, JSON.stringify(storedKeyPair))

    return {
      ecdsaPublicKeyJWK,
      ecdhPublicKeyJWK,
    }
  } catch (error) {
    console.error('Failed to generate and store keypair:', error)
    throw error
  }
}

export async function getECDSAPrivateKey(userId: string): Promise<CryptoKey> {
  try {
    const stored = getStoredKeyPair(userId)
    if (!stored) {
      throw new Error(`No keypair found for user ${userId}`)
    }

    return await importECDSAPrivateKey(stored.ecdsaPrivateKey)
  } catch (error) {
    console.error('Failed to get ECDSA private key:', error)
    throw error
  }
}

export async function getECDSAPublicKey(userId: string): Promise<CryptoKey> {
  try {
    const stored = getStoredKeyPair(userId)
    if (!stored) {
      throw new Error(`No keypair found for user ${userId}`)
    }

    return await importECDSAPublicKey(stored.ecdsaPublicKey)
  } catch (error) {
    console.error('Failed to get ECDSA public key:', error)
    throw error
  }
}

export async function getECDHPrivateKey(userId: string): Promise<CryptoKey> {
  try {
    const stored = getStoredKeyPair(userId)
    if (!stored) {
      throw new Error(`No keypair found for user ${userId}`)
    }

    return await importECDHPrivateKey(stored.ecdhPrivateKey)
  } catch (error) {
    console.error('Failed to get ECDH private key:', error)
    throw error
  }
}

export async function getECDHPublicKey(userId: string): Promise<CryptoKey> {
  try {
    const stored = getStoredKeyPair(userId)
    if (!stored) {
      throw new Error(`No keypair found for user ${userId}`)
    }

    return await importECDHPublicKey(stored.ecdhPublicKey)
  } catch (error) {
    console.error('Failed to get ECDH public key:', error)
    throw error
  }
}

export function hasKeyPair(userId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(`keypair_${userId}`) !== null
  } catch {
    return false
  }
}

export function getStoredKeyPair(userId: string): StoredKeyPair | null {
  if (typeof window === 'undefined') return null

  try {
    const data = localStorage.getItem(`keypair_${userId}`)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to get stored keypair:', error)
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
    return null
  }
}

<<<<<<< HEAD
/** Get the public keys as JWK strings (convenience) */
export function getPublicKeys(
  userId: string
): { ecdsaPublicKey: string; ecdhPublicKey: string } | null {
  const stored = getStoredKeyPair(userId)
  if (!stored) return null
  return {
    ecdsaPublicKey: stored.ecdsaPublicKey,
    ecdhPublicKey: stored.ecdhPublicKey,
  }
}

/** Get the creation date of the stored key pair */
export function getKeyPairCreatedAt(userId: string): string | null {
  const stored = getStoredKeyPair(userId)
  return stored?.createdAt ?? null
}

/** Remove a user's key pair from localStorage */
export function clearKeyPair(userId: string): void {
  localStorage.removeItem(`keypair_${userId}`)
}

/**
 * Return first 24 characters of the ECDSA public key JWK as
 * a human-readable fingerprint for display purposes.
 */
export function getKeyFingerprint(userId: string): string {
  const stored = getStoredKeyPair(userId)
  if (!stored) return 'no-key'
  return stored.ecdsaPublicKey.substring(0, 24)
}

/**
 * Rotate (regenerate) all keys for a user.
 * Clears existing keys and generates fresh ones.
 */
export async function rotateKeyPair(
  userId: string
): Promise<{ ecdsaPublicKeyJWK: string; ecdhPublicKeyJWK: string }> {
  try {
    clearKeyPair(userId)
    return await generateAndStoreKeyPair(userId)
  } catch (error) {
    throw new Error(
      `Key rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
=======
export function clearKeyPair(userId: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(`keypair_${userId}`)
  } catch (error) {
    console.error('Failed to clear keypair:', error)
  }
}

export function getKeyFingerprint(userId: string): string {
  try {
    const stored = getStoredKeyPair(userId)
    if (!stored) return ''

    // Create a simple fingerprint from the first 16 chars of hashed public key
    const hash = stored.ecdsaPublicKey.substring(0, 32)
    return hash.toUpperCase()
  } catch (error) {
    console.error('Failed to get key fingerprint:', error)
    return ''
>>>>>>> 3a501849fe490e808d9b43c89869e5bdbc8b78d9
  }
}
