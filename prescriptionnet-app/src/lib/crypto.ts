// Web Crypto API - ECDSA P-256 signing, ECDH P-256 key exchange, AES-256-GCM encryption

export async function generateECDSAKeyPair(): Promise<{
  publicKey: CryptoKey
  privateKey: CryptoKey
}> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    )

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    }
  } catch (error) {
    console.error('Failed to generate ECDSA key pair:', error)
    throw error
  }
}

export async function generateECDHKeyPair(): Promise<{
  publicKey: CryptoKey
  privateKey: CryptoKey
}> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits']
    )

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    }
  } catch (error) {
    console.error('Failed to generate ECDH key pair:', error)
    throw error
  }
}

export async function exportPublicKeyToJWK(key: CryptoKey): Promise<string> {
  try {
    const jwk = await crypto.subtle.exportKey('jwk', key)
    return JSON.stringify(jwk)
  } catch (error) {
    console.error('Failed to export public key:', error)
    throw error
  }
}

export async function exportPrivateKeyToJWK(key: CryptoKey): Promise<string> {
  try {
    const jwk = await crypto.subtle.exportKey('jwk', key)
    return JSON.stringify(jwk)
  } catch (error) {
    console.error('Failed to export private key:', error)
    throw error
  }
}

export async function importECDSAPublicKey(jwkString: string): Promise<CryptoKey> {
  try {
    const jwk = JSON.parse(jwkString)
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify']
    )
  } catch (error) {
    console.error('Failed to import ECDSA public key:', error)
    throw error
  }
}

export async function importECDSAPrivateKey(jwkString: string): Promise<CryptoKey> {
  try {
    const jwk = JSON.parse(jwkString)
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign']
    )
  } catch (error) {
    console.error('Failed to import ECDSA private key:', error)
    throw error
  }
}

export async function importECDHPublicKey(jwkString: string): Promise<CryptoKey> {
  try {
    const jwk = JSON.parse(jwkString)
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    )
  } catch (error) {
    console.error('Failed to import ECDH public key:', error)
    throw error
  }
}

export async function importECDHPrivateKey(jwkString: string): Promise<CryptoKey> {
  try {
    const jwk = JSON.parse(jwkString)
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    )
  } catch (error) {
    console.error('Failed to import ECDH private key:', error)
    throw error
  }
}

export async function signData(privateKey: CryptoKey, data: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)

    const signatureBuffer = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      dataBuffer
    )

    return arrayBufferToBase64(signatureBuffer)
  } catch (error) {
    console.error('Failed to sign data:', error)
    throw error
  }
}

export async function verifySignature(
  publicKey: CryptoKey,
  signature: string,
  data: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const signatureBuffer = base64ToArrayBuffer(signature)

    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signatureBuffer,
      dataBuffer
    )
  } catch (error) {
    console.error('Failed to verify signature:', error)
    return false
  }
}

export async function signConsentAuthorization(
  privateKey: CryptoKey,
  consentData: object
): Promise<string> {
  try {
    const jsonString = JSON.stringify(consentData)
    return await signData(privateKey, jsonString)
  } catch (error) {
    console.error('Failed to sign consent authorization:', error)
    throw error
  }
}

export async function verifyConsentSignature(
  publicKey: CryptoKey,
  signature: string,
  consentData: object
): Promise<boolean> {
  try {
    const jsonString = JSON.stringify(consentData)
    return await verifySignature(publicKey, signature, jsonString)
  } catch (error) {
    console.error('Failed to verify consent signature:', error)
    return false
  }
}

export async function generateAESKey(): Promise<CryptoKey> {
  try {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  } catch (error) {
    console.error('Failed to generate AES key:', error)
    throw error
  }
}

export async function encryptData(
  key: CryptoKey,
  data: string
): Promise<{ encrypted: string; iv: string }> {
  try {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)

    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    )

    return {
      encrypted: arrayBufferToBase64(encryptedBuffer),
      iv: arrayBufferToBase64(iv),
    }
  } catch (error) {
    console.error('Failed to encrypt data:', error)
    throw error
  }
}

export async function decryptData(
  key: CryptoKey,
  encrypted: string,
  iv: string
): Promise<string> {
  try {
    const encryptedBuffer = base64ToArrayBuffer(encrypted)
    const ivBuffer = base64ToArrayBuffer(iv)

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      key,
      encryptedBuffer
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  } catch (error) {
    console.error('Failed to decrypt data:', error)
    throw error
  }
}

export async function exportAESKey(key: CryptoKey): Promise<string> {
  try {
    const jwk = await crypto.subtle.exportKey('jwk', key)
    return JSON.stringify(jwk)
  } catch (error) {
    console.error('Failed to export AES key:', error)
    throw error
  }
}

export async function importAESKey(keyString: string): Promise<CryptoKey> {
  try {
    const jwk = JSON.parse(keyString)
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    )
  } catch (error) {
    console.error('Failed to import AES key:', error)
    throw error
  }
}

export async function deriveKeyFromPassword(
  password: string,
  salt: string
): Promise<CryptoKey> {
  try {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)
    const saltBuffer = base64ToArrayBuffer(salt)

    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  } catch (error) {
    console.error('Failed to derive key from password:', error)
    throw error
  }
}

export async function generateSalt(): Promise<string> {
  try {
    const saltBuffer = crypto.getRandomValues(new Uint8Array(16))
    return arrayBufferToBase64(saltBuffer)
  } catch (error) {
    console.error('Failed to generate salt:', error)
    throw error
  }
}

export async function encryptSessionKey(
  sessionKey: CryptoKey,
  recipientPublicKey: CryptoKey,
  senderPrivateKey: CryptoKey
): Promise<string> {
  try {
    const sessionKeyJWK = await crypto.subtle.exportKey('jwk', sessionKey)
    const sessionKeyString = JSON.stringify(sessionKeyJWK)

    const encoder = new TextEncoder()
    const sessionKeyBuffer = encoder.encode(sessionKeyString)

    const ephemeralKeyPair = await generateECDHKeyPair()

    const sharedSecret = await crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: recipientPublicKey,
      },
      ephemeralKeyPair.privateKey,
      256
    )

    const encryptionKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encryptedSessionKey = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      sessionKeyBuffer
    )

    const ephemeralPublicKeyJWK = await crypto.subtle.exportKey(
      'jwk',
      ephemeralKeyPair.publicKey
    )

    const result = {
      ephemeralPublicKey: ephemeralPublicKeyJWK,
      encryptedSessionKey: arrayBufferToBase64(encryptedSessionKey),
      iv: arrayBufferToBase64(iv),
    }

    return JSON.stringify(result)
  } catch (error) {
    console.error('Failed to encrypt session key:', error)
    throw error
  }
}

export async function decryptSessionKey(
  encryptedKey: string,
  senderPublicKey: CryptoKey,
  recipientPrivateKey: CryptoKey
): Promise<CryptoKey> {
  try {
    const result = JSON.parse(encryptedKey)

    const ephemeralPublicKey = await crypto.subtle.importKey(
      'jwk',
      result.ephemeralPublicKey,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    )

    const sharedSecret = await crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: ephemeralPublicKey,
      },
      recipientPrivateKey,
      256
    )

    const decryptionKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    const encryptedBuffer = base64ToArrayBuffer(result.encryptedSessionKey)
    const ivBuffer = base64ToArrayBuffer(result.iv)

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      decryptionKey,
      encryptedBuffer
    )

    const decoder = new TextDecoder()
    const sessionKeyString = decoder.decode(decryptedBuffer)
    const sessionKeyJWK = JSON.parse(sessionKeyString)

    return await crypto.subtle.importKey(
      'jwk',
      sessionKeyJWK,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  } catch (error) {
    console.error('Failed to decrypt session key:', error)
    throw error
  }
}

export async function sha256Hash(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  } catch (error) {
    console.error('Failed to hash data:', error)
    throw error
  }
}

export function arrayBufferToBase64(buffer: ArrayBufferLike | Uint8Array<ArrayBufferLike>): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export function generateId(): string {
  return crypto.randomUUID()
}
