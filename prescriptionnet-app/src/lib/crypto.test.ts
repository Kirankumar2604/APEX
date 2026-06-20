/**
 * PrescriptionNet — Crypto Test Suite
 * No Jest required — pure async/await tests with timing
 */

import * as crypto from '@/lib/crypto'
import * as keystore from '@/lib/keystore'
import * as session from '@/lib/session'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration?: number
}

// ═══════════════════════════════════════════════════════
// TEST RUNNER HELPERS
// ═══════════════════════════════════════════════════════

async function runSingleTest(
  name: string,
  fn: () => Promise<void>
): Promise<TestResult> {
  const start = performance.now()
  try {
    await fn()
    const duration = Math.round(performance.now() - start)
    console.log(`✅ PASS: ${name} (${duration}ms)`)
    return { name, passed: true, duration }
  } catch (error) {
    const duration = Math.round(performance.now() - start)
    const message = error instanceof Error ? error.message : String(error)
    console.error(`❌ FAIL: ${name} (${duration}ms) — ${message}`)
    return { name, passed: false, error: message, duration }
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

// ═══════════════════════════════════════════════════════
// INDIVIDUAL TESTS
// ═══════════════════════════════════════════════════════

async function testECDSAKeypairGeneration(): Promise<TestResult> {
  return runSingleTest('ECDSA Keypair Generation', async () => {
    const { publicKey, privateKey } = await crypto.generateECDSAKeyPair()
    assert(publicKey.type === 'public', 'Public key type mismatch')
    assert(privateKey.type === 'private', 'Private key type mismatch')
    assert(publicKey.algorithm.name === 'ECDSA', 'Public key algorithm mismatch')
    assert(privateKey.algorithm.name === 'ECDSA', 'Private key algorithm mismatch')
    assert(publicKey.extractable === true, 'Public key not extractable')
    assert(privateKey.extractable === true, 'Private key not extractable')
  })
}

async function testECDHKeypairGeneration(): Promise<TestResult> {
  return runSingleTest('ECDH Keypair Generation', async () => {
    const { publicKey, privateKey } = await crypto.generateECDHKeyPair()
    assert(publicKey.type === 'public', 'Public key type mismatch')
    assert(privateKey.type === 'private', 'Private key type mismatch')
    assert(publicKey.algorithm.name === 'ECDH', 'Public key algorithm mismatch')
    assert(privateKey.algorithm.name === 'ECDH', 'Private key algorithm mismatch')
  })
}

async function testKeyExportImport(): Promise<TestResult> {
  return runSingleTest('Key Export/Import Roundtrip', async () => {
    // ECDSA
    const ecdsa = await crypto.generateECDSAKeyPair()
    const ecdsaPubJWK = await crypto.exportPublicKeyToJWK(ecdsa.publicKey)
    const ecdsaPrivJWK = await crypto.exportPrivateKeyToJWK(ecdsa.privateKey)
    assert(ecdsaPubJWK.length > 10, 'ECDSA public JWK too short')
    assert(ecdsaPrivJWK.length > 10, 'ECDSA private JWK too short')

    const reimportedPub = await crypto.importECDSAPublicKey(ecdsaPubJWK)
    const reimportedPriv = await crypto.importECDSAPrivateKey(ecdsaPrivJWK)
    assert(reimportedPub.type === 'public', 'Reimported public key type wrong')
    assert(reimportedPriv.type === 'private', 'Reimported private key type wrong')

    // Sign with reimported private, verify with reimported public
    const sig = await crypto.signData(reimportedPriv, 'roundtrip test')
    const valid = await crypto.verifySignature(reimportedPub, sig, 'roundtrip test')
    assert(valid, 'Reimported key roundtrip signature invalid')

    // ECDH
    const ecdh = await crypto.generateECDHKeyPair()
    const ecdhPubJWK = await crypto.exportPublicKeyToJWK(ecdh.publicKey)
    const ecdhPrivJWK = await crypto.exportPrivateKeyToJWK(ecdh.privateKey)
    const reimportedEcdhPub = await crypto.importECDHPublicKey(ecdhPubJWK)
    const reimportedEcdhPriv = await crypto.importECDHPrivateKey(ecdhPrivJWK)
    assert(reimportedEcdhPub.type === 'public', 'ECDH pub reimport failed')
    assert(reimportedEcdhPriv.type === 'private', 'ECDH priv reimport failed')
  })
}

async function testSignatureVerification(): Promise<TestResult> {
  return runSingleTest('ECDSA Sign + Verify', async () => {
    const { publicKey, privateKey } = await crypto.generateECDSAKeyPair()
    const data = 'Hello PrescriptionNet!'
    const signature = await crypto.signData(privateKey, data)
    assert(signature.length > 0, 'Signature is empty')

    const valid = await crypto.verifySignature(publicKey, signature, data)
    assert(valid === true, 'Valid signature rejected')

    // Tampered data should fail
    const tampered = await crypto.verifySignature(publicKey, signature, 'Tampered data')
    assert(tampered === false, 'Tampered data accepted')
  })
}

async function testConsentSigning(): Promise<TestResult> {
  return runSingleTest('Consent Sign + Verify', async () => {
    const { publicKey, privateKey } = await crypto.generateECDSAKeyPair()

    const consentData = {
      requestId: 'req-001',
      patientId: 'patient-001',
      requesterId: 'doctor-001',
      scope: 'Prescriptions Only',
      purpose: 'Consultation',
      duration: '24 Hours',
      timestamp: new Date().toISOString(),
    }

    const sig = await crypto.signConsentAuthorization(privateKey, consentData)
    assert(sig.length > 0, 'Consent signature empty')

    const valid = await crypto.verifyConsentSignature(publicKey, sig, consentData)
    assert(valid === true, 'Consent signature rejected')

    // Tampered consent
    const tampered = { ...consentData, scope: 'Full Medical History' }
    const invalid = await crypto.verifyConsentSignature(publicKey, sig, tampered)
    assert(invalid === false, 'Tampered consent accepted')
  })
}

async function testAESEncryption(): Promise<TestResult> {
  return runSingleTest('AES-256-GCM Encrypt + Decrypt', async () => {
    const key = await crypto.generateAESKey()
    const plaintext = 'Sensitive patient data: HbA1c = 7.8%'
    const { encrypted, iv } = await crypto.encryptData(key, plaintext)
    assert(encrypted.length > 0, 'Ciphertext empty')
    assert(iv.length > 0, 'IV empty')

    const decrypted = await crypto.decryptData(key, encrypted, iv)
    assert(decrypted === plaintext, 'Decrypted data mismatch')

    // Export/import roundtrip
    const exported = await crypto.exportAESKey(key)
    const reimported = await crypto.importAESKey(exported)
    const decrypted2 = await crypto.decryptData(reimported, encrypted, iv)
    assert(decrypted2 === plaintext, 'AES key reimport decryption failed')
  })
}

async function testPBKDF2(): Promise<TestResult> {
  return runSingleTest('PBKDF2 Key Derivation', async () => {
    const salt = await crypto.generateSalt()
    assert(salt.length > 0, 'Salt empty')

    const key = await crypto.deriveKeyFromPassword('securepassword123', salt)
    assert(key.type === 'secret', 'Derived key type wrong')

    // Same password + salt should produce same key
    const key2 = await crypto.deriveKeyFromPassword('securepassword123', salt)
    const exported1 = await crypto.exportAESKey(key)
    const exported2 = await crypto.exportAESKey(key2)
    assert(exported1 === exported2, 'Same password+salt produced different keys')

    // Different password should produce different key
    const key3 = await crypto.deriveKeyFromPassword('differentpassword', salt)
    const exported3 = await crypto.exportAESKey(key3)
    assert(exported3 !== exported1, 'Different password produced same key')
  })
}

async function testHybridEncryption(): Promise<TestResult> {
  return runSingleTest('ECDH Session Key Exchange', async () => {
    // Simulate patient and requester key pairs
    const patientECDH = await crypto.generateECDHKeyPair()
    const requesterECDH = await crypto.generateECDHKeyPair()

    // Generate session key
    const sessionKey = await crypto.generateAESKey()
    const originalKeyExport = await crypto.exportAESKey(sessionKey)

    // Patient encrypts session key for requester
    const encryptedSessionKey = await crypto.encryptSessionKey(
      sessionKey,
      requesterECDH.publicKey,
      patientECDH.privateKey
    )
    assert(encryptedSessionKey.length > 0, 'Encrypted session key empty')

    // Requester decrypts session key
    const decryptedSessionKey = await crypto.decryptSessionKey(
      encryptedSessionKey,
      patientECDH.publicKey,
      requesterECDH.privateKey
    )
    const decryptedKeyExport = await crypto.exportAESKey(decryptedSessionKey)
    assert(
      decryptedKeyExport === originalKeyExport,
      'Session key roundtrip failed — keys differ'
    )
  })
}

async function testSHA256(): Promise<TestResult> {
  return runSingleTest('SHA-256 Hashing', async () => {
    const hash = await crypto.sha256Hash('hello')
    assert(hash.startsWith('0x'), 'Hash should start with 0x')
    assert(hash.length === 66, 'SHA-256 hex hash should be 66 chars (0x + 64)')

    // Deterministic
    const hash2 = await crypto.sha256Hash('hello')
    assert(hash === hash2, 'Same input should produce same hash')

    // Different input → different hash
    const hash3 = await crypto.sha256Hash('world')
    assert(hash3 !== hash, 'Different inputs should produce different hashes')
  })
}

async function testUtilityFunctions(): Promise<TestResult> {
  return runSingleTest('Utility Functions', async () => {
    // base64 roundtrip
    const original = new Uint8Array([0, 1, 2, 255, 128, 64])
    const b64 = crypto.arrayBufferToBase64(original.buffer)
    const decoded = new Uint8Array(crypto.base64ToArrayBuffer(b64))
    assert(decoded.length === original.length, 'Base64 roundtrip length mismatch')
    for (let i = 0; i < original.length; i++) {
      assert(decoded[i] === original[i], `Base64 roundtrip byte mismatch at ${i}`)
    }

    // generateId
    const id1 = crypto.generateId()
    const id2 = crypto.generateId()
    assert(id1.length > 0, 'generateId returned empty')
    assert(id1 !== id2, 'generateId not unique')

    // generateSessionId
    const sid = crypto.generateSessionId()
    assert(sid.startsWith('session-'), 'Session ID should start with "session-"')
  })
}

async function testKeystoreOperations(): Promise<TestResult> {
  return runSingleTest('Keystore Operations', async () => {
    const testUserId = `test-user-${Date.now()}`

    // Initially no key pair
    assert(!keystore.hasKeyPair(testUserId), 'Should not have keypair initially')

    // Generate and store
    const keys = await keystore.generateAndStoreKeyPair(testUserId)
    assert(keys.ecdsaPublicKeyJWK.length > 0, 'ECDSA public key empty')
    assert(keys.ecdhPublicKeyJWK.length > 0, 'ECDH public key empty')
    assert(keystore.hasKeyPair(testUserId), 'Should have keypair after generation')

    // Retrieve keys
    const ecdsaPriv = await keystore.getECDSAPrivateKey(testUserId)
    const ecdsaPub = await keystore.getECDSAPublicKey(testUserId)
    assert(ecdsaPriv.type === 'private', 'ECDSA private type wrong')
    assert(ecdsaPub.type === 'public', 'ECDSA public type wrong')

    const ecdhPriv = await keystore.getECDHPrivateKey(testUserId)
    const ecdhPub = await keystore.getECDHPublicKey(testUserId)
    assert(ecdhPriv.type === 'private', 'ECDH private type wrong')
    assert(ecdhPub.type === 'public', 'ECDH public type wrong')

    // Fingerprint
    const fp = keystore.getKeyFingerprint(testUserId)
    assert(fp.length === 24, 'Fingerprint should be 24 chars')

    // Rotate
    const newKeys = await keystore.rotateKeyPair(testUserId)
    assert(newKeys.ecdsaPublicKeyJWK !== keys.ecdsaPublicKeyJWK, 'Rotated key should differ')

    // Cleanup
    keystore.clearKeyPair(testUserId)
    assert(!keystore.hasKeyPair(testUserId), 'Should not have keypair after clear')
  })
}

async function testFullConsentFlow(): Promise<TestResult> {
  return runSingleTest('Full Consent Flow (E2E)', async () => {
    const patientId = `test-patient-${Date.now()}`
    const requesterId = `test-requester-${Date.now()}`

    // 1. Generate key pairs for both users
    await keystore.generateAndStoreKeyPair(patientId)
    await keystore.generateAndStoreKeyPair(requesterId)

    // 2. Sign a consent
    const consentData = {
      requestId: 'test-req-001',
      patientId,
      requesterId,
      scope: 'Prescriptions Only',
      purpose: 'Consultation',
      duration: '1 Hour',
      timestamp: new Date().toISOString(),
    }
    const patientPrivKey = await keystore.getECDSAPrivateKey(patientId)
    const signature = await crypto.signConsentAuthorization(patientPrivKey, consentData)
    assert(signature.length > 0, 'Consent signature empty')

    // 3. Verify the consent
    const patientPubKey = await keystore.getECDSAPublicKey(patientId)
    const isValid = await crypto.verifyConsentSignature(patientPubKey, signature, consentData)
    assert(isValid, 'Consent signature verification failed')

    // 4. Create encrypted session
    const patientData = { prescriptions: [{ drug: 'Metformin', dosage: '500mg' }] }
    const expiresAt = new Date(Date.now() + 3600000).toISOString()
    const sessionResult = await session.createSecureSession(
      'test-consent-001',
      patientId,
      requesterId,
      patientData,
      expiresAt
    )
    assert(sessionResult.sessionId.startsWith('session-'), 'Invalid session ID')
    assert(sessionResult.encryptedData.length > 0, 'Encrypted data empty')

    // 5. Requester decrypts session
    const decrypted = await session.accessSecureSession(
      sessionResult.sessionId,
      requesterId
    )
    assert(decrypted !== null, 'Decryption returned null')
    const decryptedObj = decrypted as { prescriptions: Array<{ drug: string }> }
    assert(
      decryptedObj.prescriptions[0].drug === 'Metformin',
      'Decrypted data mismatch'
    )

    // 6. Expire session
    session.expireSession(sessionResult.sessionId)
    const expiredResult = await session.accessSecureSession(
      sessionResult.sessionId,
      requesterId
    )
    assert(expiredResult === null, 'Expired session should return null')

    // Cleanup
    keystore.clearKeyPair(patientId)
    keystore.clearKeyPair(requesterId)
  })
}

// ═══════════════════════════════════════════════════════
// TEST REGISTRY
// ═══════════════════════════════════════════════════════

const TEST_REGISTRY: Record<string, () => Promise<TestResult>> = {
  keypair: testECDSAKeypairGeneration,
  'ecdh-keypair': testECDHKeypairGeneration,
  'export-import': testKeyExportImport,
  signature: testSignatureVerification,
  consent: testConsentSigning,
  aes: testAESEncryption,
  pbkdf2: testPBKDF2,
  hybrid: testHybridEncryption,
  hash: testSHA256,
  utility: testUtilityFunctions,
  keystore: testKeystoreOperations,
  'full-flow': testFullConsentFlow,
}

// ═══════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════

/** Run a single named test */
export async function runTest(name: string): Promise<TestResult | null> {
  const testFn = TEST_REGISTRY[name]
  if (!testFn) {
    console.error(`Unknown test: ${name}`)
    return null
  }
  return testFn()
}

/** Run every test in the registry and return results array */
export async function runAllTests(): Promise<TestResult[]> {
  console.log('═══════════════════════════════════════')
  console.log(' PrescriptionNet Crypto Test Suite')
  console.log('═══════════════════════════════════════')

  const results: TestResult[] = []
  const totalStart = performance.now()

  for (const testFn of Object.values(TEST_REGISTRY)) {
    const result = await testFn()
    results.push(result)
  }

  const totalTime = Math.round(performance.now() - totalStart)
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  console.log('═══════════════════════════════════════')
  console.log(`Results: ${passed} passed, ${failed} failed (${totalTime}ms)`)
  console.log('═══════════════════════════════════════')

  return results
}
