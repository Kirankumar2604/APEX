import {
  generateECDSAKeyPair,
  generateECDHKeyPair,
  exportPublicKeyToJWK,
  exportPrivateKeyToJWK,
  importECDSAPublicKey,
  importECDSAPrivateKey,
  importECDHPublicKey,
  importECDHPrivateKey,
  sha256Hash,
} from './crypto'

interface StoredKeyPair {
  ecdsaPublicKey: string
  ecdsaPrivateKey: string
  ecdhPublicKey: string
  ecdhPrivateKey: string
  userId: string
  createdAt: string
}

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
      ecdsaPublicKey: ecdsaPublicKeyJWK,
      ecdsaPrivateKey: ecdsaPrivateKeyJWK,
      ecdhPublicKey: ecdhPublicKeyJWK,
      ecdhPrivateKey: ecdhPrivateKeyJWK,
      userId,
      createdAt: new Date().toISOString(),
    }

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
    return null
  }
}

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
  }
}
