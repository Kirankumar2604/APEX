// Web Crypto API helpers for signatures, encryption, and key exchange.

export async function generateECDSAKeyPair(): Promise<{
  publicKey: CryptoKey
  privateKey: CryptoKey
}> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  )
  return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey }
}

export async function generateECDHKeyPair(): Promise<{
  publicKey: CryptoKey
  privateKey: CryptoKey
}> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  )
  return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey }
}

export async function exportPublicKeyToJWK(key: CryptoKey): Promise<string> {
  return JSON.stringify(await crypto.subtle.exportKey('jwk', key))
}

export async function exportPrivateKeyToJWK(key: CryptoKey): Promise<string> {
  return JSON.stringify(await crypto.subtle.exportKey('jwk', key))
}

export async function importECDSAPublicKey(jwkString: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', JSON.parse(jwkString), { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify'])
}

export async function importECDSAPrivateKey(jwkString: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', JSON.parse(jwkString), { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign'])
}

export async function importECDHPublicKey(jwkString: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', JSON.parse(jwkString), { name: 'ECDH', namedCurve: 'P-256' }, true, [])
}

export async function importECDHPrivateKey(jwkString: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', JSON.parse(jwkString), { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits'])
}

export async function signData(privateKey: CryptoKey, data: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(data)
  )
  return arrayBufferToBase64(signature)
}

export async function verifySignature(
  publicKey: CryptoKey,
  signature: string,
  data: string
): Promise<boolean> {
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    base64ToArrayBuffer(signature),
    new TextEncoder().encode(data)
  )
}

export async function signConsentAuthorization(
  privateKey: CryptoKey,
  consentData: object
): Promise<string> {
  return signData(privateKey, JSON.stringify(consentData))
}

export async function verifyConsentSignature(
  publicKey: CryptoKey,
  signature: string,
  consentData: object
): Promise<boolean> {
  return verifySignature(publicKey, signature, JSON.stringify(consentData))
}

export async function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}

export async function encryptData(
  key: CryptoKey,
  data: string
): Promise<{ encrypted: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(data)
  )
  return { encrypted: arrayBufferToBase64(encrypted), iv: arrayBufferToBase64(iv) }
}

export async function decryptData(
  key: CryptoKey,
  encrypted: string,
  iv: string
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArrayBuffer(iv) },
    key,
    base64ToArrayBuffer(encrypted)
  )
  return new TextDecoder().decode(decrypted)
}

export async function exportAESKey(key: CryptoKey): Promise<string> {
  return JSON.stringify(await crypto.subtle.exportKey('jwk', key))
}

export async function importAESKey(keyString: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', JSON.parse(keyString), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
}

export async function deriveKeyFromPassword(password: string, salt: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: base64ToArrayBuffer(salt), iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function generateSalt(): Promise<string> {
  return arrayBufferToBase64(crypto.getRandomValues(new Uint8Array(16)))
}

export async function encryptSessionKey(
  sessionKey: CryptoKey,
  recipientPublicKey: CryptoKey,
  senderPrivateKey: CryptoKey
): Promise<string> {
  const exported = await exportAESKey(sessionKey)
  const signature = await signData(senderPrivateKey, exported)
  return JSON.stringify({ exported, recipientPublicKey: await crypto.subtle.exportKey('jwk', recipientPublicKey), signature })
}

export async function decryptSessionKey(
  encryptedKey: string,
  senderPublicKey: CryptoKey,
  recipientPrivateKey: CryptoKey
): Promise<CryptoKey> {
  const payload = JSON.parse(encryptedKey) as { exported: string }
  return importAESKey(payload.exported)
}

export async function sha256Hash(data: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function arrayBufferToBase64(buffer: ArrayBufferLike | Uint8Array<ArrayBufferLike>): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary)
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer
}

export function generateId(): string {
  return crypto.randomUUID()
}
