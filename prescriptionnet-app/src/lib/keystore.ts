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

export interface StoredKeyPair {
  ecdsaPublicKey: string
  ecdsaPrivateKey: string
  ecdhPublicKey: string
  ecdhPrivateKey: string
  userId: string
  createdAt: string
}

function readStoredKeyPair(userId: string): StoredKeyPair | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`keypair_${userId}`)
    return raw ? (JSON.parse(raw) as StoredKeyPair) : null
  } catch {
    return null
  }
}

export async function generateAndStoreKeyPair(userId: string): Promise<{
  ecdsaPublicKeyJWK: string
  ecdhPublicKeyJWK: string
}> {
  if (typeof window === 'undefined') {
    throw new Error('Keystore requires browser context')
  }

  const existing = readStoredKeyPair(userId)
  if (existing) {
    return {
      ecdsaPublicKeyJWK: existing.ecdsaPublicKey,
      ecdhPublicKeyJWK: existing.ecdhPublicKey,
    }
  }

  const ecdsaKeyPair = await generateECDSAKeyPair()
  const ecdhKeyPair = await generateECDHKeyPair()

  const storedKeyPair: StoredKeyPair = {
    ecdsaPublicKey: await exportPublicKeyToJWK(ecdsaKeyPair.publicKey),
    ecdsaPrivateKey: await exportPrivateKeyToJWK(ecdsaKeyPair.privateKey),
    ecdhPublicKey: await exportPublicKeyToJWK(ecdhKeyPair.publicKey),
    ecdhPrivateKey: await exportPrivateKeyToJWK(ecdhKeyPair.privateKey),
    userId,
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem(`keypair_${userId}`, JSON.stringify(storedKeyPair))

  return {
    ecdsaPublicKeyJWK: storedKeyPair.ecdsaPublicKey,
    ecdhPublicKeyJWK: storedKeyPair.ecdhPublicKey,
  }
}

export async function getECDSAPrivateKey(userId: string): Promise<CryptoKey> {
  const stored = getStoredKeyPair(userId)
  if (!stored) throw new Error(`No keypair found for user ${userId}`)
  return importECDSAPrivateKey(stored.ecdsaPrivateKey)
}

export async function getECDSAPublicKey(userId: string): Promise<CryptoKey> {
  const stored = getStoredKeyPair(userId)
  if (!stored) throw new Error(`No keypair found for user ${userId}`)
  return importECDSAPublicKey(stored.ecdsaPublicKey)
}

export async function getECDHPrivateKey(userId: string): Promise<CryptoKey> {
  const stored = getStoredKeyPair(userId)
  if (!stored) throw new Error(`No keypair found for user ${userId}`)
  return importECDHPrivateKey(stored.ecdhPrivateKey)
}

export async function getECDHPublicKey(userId: string): Promise<CryptoKey> {
  const stored = getStoredKeyPair(userId)
  if (!stored) throw new Error(`No keypair found for user ${userId}`)
  return importECDHPublicKey(stored.ecdhPublicKey)
}

export function hasKeyPair(userId: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(`keypair_${userId}`) !== null
}

export function getStoredKeyPair(userId: string): StoredKeyPair | null {
  return readStoredKeyPair(userId)
}

export function getKeyPairCreatedAt(userId: string): string | null {
  return getStoredKeyPair(userId)?.createdAt ?? null
}

export function getKeyFingerprint(userId: string): string | null {
  const stored = getStoredKeyPair(userId)
  if (!stored) return null
  return stored.ecdsaPublicKey.slice(0, 32)
}

export async function rotateKeyPair(userId: string): Promise<{
  ecdsaPublicKeyJWK: string
  ecdhPublicKeyJWK: string
}> {
  if (typeof window === 'undefined') throw new Error('Keystore requires browser context')
  localStorage.removeItem(`keypair_${userId}`)
  return generateAndStoreKeyPair(userId)
}
