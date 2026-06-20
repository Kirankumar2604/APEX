/**
 * PrescriptionNet — Cryptographic Primitives
 * Pure Web Crypto API implementation — zero external dependencies
 */

// ═══════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════

/** Convert an ArrayBuffer to a base64 string */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/** Convert a base64 string to an ArrayBuffer */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/** Generate a cryptographically random UUID */
export function generateId(): string {
  return crypto.randomUUID()
}

/** Generate a session ID with "session-" prefix */
export function generateSessionId(): string {
  return `session-${crypto.randomUUID()}`
}

// ═══════════════════════════════════════════════════════
// ECDSA — Digital Signatures (P-256 / SHA-256)
// ═══════════════════════════════════════════════════════

/** Generate an ECDSA P-256 key pair for signing & verification */
export async function generateECDSAKeyPair(): Promise<{
  publicKey: CryptoKey
  privateKey: CryptoKey
}> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    )
    return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey }
  } catch (error) {
    throw new Error(
      `ECDSA key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Sign arbitrary string data with an ECDSA private key, returning base64 */
export async function signData(
  privateKey: CryptoKey,
  data: string
): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const encoded = encoder.encode(data)
    const signatureBuffer = await crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      privateKey,
      encoded
    )
    return arrayBufferToBase64(signatureBuffer)
  } catch (error) {
    throw new Error(
      `Data signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Verify a base64 ECDSA signature against the original data */
export async function verifySignature(
  publicKey: CryptoKey,
  signature: string,
  data: string
): Promise<boolean> {
  try {
    const signatureBuffer = base64ToArrayBuffer(signature)
    const encoder = new TextEncoder()
    const encoded = encoder.encode(data)
    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      publicKey,
      signatureBuffer,
      encoded
    )
  } catch {
    return false
  }
}

/** Build a canonical consent string for deterministic signing */
function canonicalConsentString(consentData: {
  requestId: string
  patientId: string
  requesterId: string
  scope: string
  purpose: string
  duration: string
  timestamp: string
}): string {
  return JSON.stringify({
    requestId: consentData.requestId,
    patientId: consentData.patientId,
    requesterId: consentData.requesterId,
    scope: consentData.scope,
    purpose: consentData.purpose,
    duration: consentData.duration,
    timestamp: consentData.timestamp,
  })
}

/** Sign a consent authorization object */
export async function signConsentAuthorization(
  patientPrivateKey: CryptoKey,
  consentData: {
    requestId: string
    patientId: string
    requesterId: string
    scope: string
    purpose: string
    duration: string
    timestamp: string
  }
): Promise<string> {
  try {
    const canonical = canonicalConsentString(consentData)
    return await signData(patientPrivateKey, canonical)
  } catch (error) {
    throw new Error(
      `Consent signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Verify a consent signature against the original consent data */
export async function verifyConsentSignature(
  patientPublicKey: CryptoKey,
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
): Promise<boolean> {
  try {
    const canonical = canonicalConsentString(consentData)
    return await verifySignature(patientPublicKey, signature, canonical)
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════════════════
// ECDH — Key Exchange (P-256)
// ═══════════════════════════════════════════════════════

/** Generate an ECDH P-256 key pair for secure key exchange */
export async function generateECDHKeyPair(): Promise<{
  publicKey: CryptoKey
  privateKey: CryptoKey
}> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    )
    return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey }
  } catch (error) {
    throw new Error(
      `ECDH key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ═══════════════════════════════════════════════════════
// KEY EXPORT / IMPORT (JWK)
// ═══════════════════════════════════════════════════════

/** Export any public CryptoKey to a JWK JSON string */
export async function exportPublicKeyToJWK(key: CryptoKey): Promise<string> {
  try {
    const jwk = await crypto.subtle.exportKey('jwk', key)
    return JSON.stringify(jwk)
  } catch (error) {
    throw new Error(
      `Public key export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Export any private CryptoKey to a JWK JSON string */
export async function exportPrivateKeyToJWK(key: CryptoKey): Promise<string> {
  try {
    const jwk = await crypto.subtle.exportKey('jwk', key)
    return JSON.stringify(jwk)
  } catch (error) {
    throw new Error(
      `Private key export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Import an ECDSA public key from a JWK JSON string */
export async function importECDSAPublicKey(jwkString: string): Promise<CryptoKey> {
  try {
    const jwk: JsonWebKey = JSON.parse(jwkString)
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify']
    )
  } catch (error) {
    throw new Error(
      `ECDSA public key import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Import an ECDSA private key from a JWK JSON string */
export async function importECDSAPrivateKey(jwkString: string): Promise<CryptoKey> {
  try {
    const jwk: JsonWebKey = JSON.parse(jwkString)
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign']
    )
  } catch (error) {
    throw new Error(
      `ECDSA private key import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Import an ECDH public key from a JWK JSON string */
export async function importECDHPublicKey(jwkString: string): Promise<CryptoKey> {
  try {
    const jwk: JsonWebKey = JSON.parse(jwkString)
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    )
  } catch (error) {
    throw new Error(
      `ECDH public key import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Import an ECDH private key from a JWK JSON string */
export async function importECDHPrivateKey(jwkString: string): Promise<CryptoKey> {
  try {
    const jwk: JsonWebKey = JSON.parse(jwkString)
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    )
  } catch (error) {
    throw new Error(
      `ECDH private key import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ═══════════════════════════════════════════════════════
// AES-GCM — Symmetric Encryption (256-bit)
// ═══════════════════════════════════════════════════════

/** Generate a random AES-256-GCM key */
export async function generateAESKey(): Promise<CryptoKey> {
  try {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  } catch (error) {
    throw new Error(
      `AES key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Encrypt a string with AES-GCM, returning base64 ciphertext + IV */
export async function encryptData(
  key: CryptoKey,
  data: string
): Promise<{ encrypted: string; iv: string }> {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoder = new TextEncoder()
    const encoded = encoder.encode(data)
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    )
    return {
      encrypted: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv.buffer),
    }
  } catch (error) {
    throw new Error(
      `AES encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Decrypt AES-GCM ciphertext (base64) with the given key and IV (base64) */
export async function decryptData(
  key: CryptoKey,
  encrypted: string,
  iv: string
): Promise<string> {
  try {
    const ciphertextBuffer = base64ToArrayBuffer(encrypted)
    const ivBuffer = base64ToArrayBuffer(iv)
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
      key,
      ciphertextBuffer
    )
    const decoder = new TextDecoder()
    return decoder.decode(plaintext)
  } catch (error) {
    throw new Error(
      `AES decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Export an AES key to a base64 string */
export async function exportAESKey(key: CryptoKey): Promise<string> {
  try {
    const raw = await crypto.subtle.exportKey('raw', key)
    return arrayBufferToBase64(raw)
  } catch (error) {
    throw new Error(
      `AES key export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Import an AES key from a base64 string */
export async function importAESKey(keyString: string): Promise<CryptoKey> {
  try {
    const raw = base64ToArrayBuffer(keyString)
    return await crypto.subtle.importKey(
      'raw',
      raw,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  } catch (error) {
    throw new Error(
      `AES key import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ═══════════════════════════════════════════════════════
// PBKDF2 — Password-Based Key Derivation
// ═══════════════════════════════════════════════════════

/** Derive an AES-256-GCM key from a password using PBKDF2 */
export async function deriveKeyFromPassword(
  password: string,
  salt: string
): Promise<CryptoKey> {
  try {
    const encoder = new TextEncoder()
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    )
    const saltBuffer = base64ToArrayBuffer(salt)
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  } catch (error) {
    throw new Error(
      `PBKDF2 key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** Generate a random 16-byte salt, returned as base64 */
export async function generateSalt(): Promise<string> {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    return arrayBufferToBase64(salt.buffer)
  } catch (error) {
    throw new Error(
      `Salt generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ═══════════════════════════════════════════════════════
// HYBRID ENCRYPTION — ECDH + AES Session Key Exchange
// ═══════════════════════════════════════════════════════

/**
 * Encrypt a session key for a recipient using ECDH key agreement.
 * sender's ECDH private + recipient's ECDH public → shared AES key → encrypt session key
 */
export async function encryptSessionKey(
  sessionKey: CryptoKey,
  recipientECDHPublicKey: CryptoKey,
  senderECDHPrivateKey: CryptoKey
): Promise<string> {
  try {
    // Derive shared AES key via ECDH
    const sharedKey = await crypto.subtle.deriveKey(
      { name: 'ECDH', public: recipientECDHPublicKey },
      senderECDHPrivateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )

    // Export session key to raw bytes
    const sessionKeyRaw = await crypto.subtle.exportKey('raw', sessionKey)

    // Encrypt the raw session key with the shared key
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encryptedKey = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      sessionKeyRaw
    )

    // Pack IV + ciphertext into a single base64 string
    const combined = new Uint8Array(iv.byteLength + encryptedKey.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encryptedKey), iv.byteLength)

    return arrayBufferToBase64(combined.buffer)
  } catch (error) {
    throw new Error(
      `Session key encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Decrypt a session key using ECDH key agreement (reverse direction).
 * recipient's ECDH private + sender's ECDH public → same shared AES key → decrypt session key
 */
export async function decryptSessionKey(
  encryptedSessionKey: string,
  senderECDHPublicKey: CryptoKey,
  recipientECDHPrivateKey: CryptoKey
): Promise<CryptoKey> {
  try {
    // Derive same shared AES key
    const sharedKey = await crypto.subtle.deriveKey(
      { name: 'ECDH', public: senderECDHPublicKey },
      recipientECDHPrivateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )

    // Unpack IV + ciphertext
    const combined = new Uint8Array(base64ToArrayBuffer(encryptedSessionKey))
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)

    // Decrypt the raw session key
    const sessionKeyRaw = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      ciphertext
    )

    // Re-import as AES-GCM key
    return await crypto.subtle.importKey(
      'raw',
      sessionKeyRaw,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  } catch (error) {
    throw new Error(
      `Session key decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ═══════════════════════════════════════════════════════
// SHA-256 HASH
// ═══════════════════════════════════════════════════════

/** Compute SHA-256 hash of a string and return as "0x" + hex */
export async function sha256Hash(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const encoded = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
    const hashArray = new Uint8Array(hashBuffer)
    const hex = Array.from(hashArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return `0x${hex}`
  } catch (error) {
    throw new Error(
      `SHA-256 hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
