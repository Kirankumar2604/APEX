/**
 * PrescriptionNet — Cryptographic Keystore
 * Manages ECDSA + ECDH key pairs in localStorage
 */

import {
  generateECDSAKeyPair,
  generateECDHKeyPair,
  exportPublicKeyToJWK,
  exportPrivateKeyToJWK,
  importECDSAPublicKey,
  importECDSAPrivateKey,
  importECDHPublicKey,
  importECDHPrivateKey,
} from '@/lib/crypto'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface StoredKeyPair {
  ecdsaPublicKey: string   // JWK JSON string
  ecdsaPrivateKey: string  // JWK JSON string
  ecdhPublicKey: string    // JWK JSON string
  ecdhPrivateKey: string   // JWK JSON string
  userId: string
  createdAt: string
}

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
      ecdsaPublicKey: ecdsaPublicKeyJWK,
      ecdsaPrivateKey: ecdsaPrivateKeyJWK,
      ecdhPublicKey: ecdhPublicKeyJWK,
      ecdhPrivateKey: ecdhPrivateKeyJWK,
      userId,
      createdAt: new Date().toISOString(),
    }

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
    return null
  }
}

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
  }
}
