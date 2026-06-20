'use client'

import { useState, useEffect } from 'react'
import { Fingerprint, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react'

interface FingerprintModalProps {
  mode: 'register' | 'verify'
  onSuccess: () => void
  onCancel: () => void
  patientId?: string
  patientName?: string
}

type ScanState = 'idle' | 'scanning' | 'success' | 'failed'

export function FingerprintModal({ mode, onSuccess, onCancel, patientId, patientName }: FingerprintModalProps) {
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [isRealAuthnSupported, setIsRealAuthnSupported] = useState(false)

  useEffect(() => {
    // Check if WebAuthn is supported by browser
    if (window.PublicKeyCredential) {
      setIsRealAuthnSupported(true)
    }
  }, [])

  // Simulated scan progress
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (scanState === 'scanning' && errorMsg === '') {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setScanState('success')
            return 100
          }
          return prev + 10
        })
      }, 60)
    } else {
      setProgress(0)
    }

    return () => clearInterval(interval)
  }, [scanState, errorMsg])

  // Trigger success callback after check animation
  useEffect(() => {
    if (scanState === 'success') {
      const timeout = setTimeout(() => {
        onSuccess()
      }, 1200)
      return () => clearTimeout(timeout)
    }
  }, [scanState, onSuccess])

  const handleStartRealScan = async () => {
    setErrorMsg('')
    setScanState('scanning')

    try {
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser.")
      }

      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      if (mode === 'register') {
        const uId = patientId || 'patient-002'
        const uName = patientName || 'Rajesh Kumar'

        const createOptions: CredentialCreationOptions = {
          publicKey: {
            challenge: challenge,
            rp: {
              name: "PrescriptionNet",
              id: window.location.hostname
            },
            user: {
              id: Uint8Array.from(uId, c => c.charCodeAt(0)),
              name: uName,
              displayName: uName
            },
            pubKeyCredParams: [
              { type: "public-key", alg: -7 }, // ES256
              { type: "public-key", alg: -257 } // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform", // Prompts for Touch ID / Windows Hello
              userVerification: "required"
            },
            timeout: 60000,
            attestation: "none"
          }
        }

        const credential = await navigator.credentials.create(createOptions)
        if (!credential) {
          throw new Error("Biometric registration cancelled.")
        }
        localStorage.setItem(`prescriptionnet_biometric_cred_${uId}`, credential.id)
      } else {
        // Authenticate request
        const getOptions: CredentialRequestOptions = {
          publicKey: {
            challenge: challenge,
            rpId: window.location.hostname,
            userVerification: "required",
            timeout: 60000
          }
        }

        const assertion = await navigator.credentials.get(getOptions)
        if (!assertion) {
          throw new Error("Biometric verification cancelled.")
        }
      }

      setScanState('success')
    } catch (err: any) {
      console.warn("Real biometric scan failed/not available:", err.message)
      setErrorMsg(err.message || "Biometric prompt closed or unsupported.")
      setScanState('failed')
    }
  }

  const handleStartSimulatedScan = () => {
    setErrorMsg('')
    setScanState('scanning')
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '24px',
        padding: '24px',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Close Button */}
        <button
          onClick={onCancel}
          disabled={scanState === 'scanning'}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: scanState === 'scanning' ? 'default' : 'pointer',
            transition: 'color 0.2s',
            padding: 0
          }}
          onMouseEnter={(e) => { if (scanState !== 'scanning') e.currentTarget.style.color = '#f1f5f9' }}
          onMouseLeave={(e) => { if (scanState !== 'scanning') e.currentTarget.style.color = '#64748b' }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>
            {mode === 'register' ? 'Register Biometric 2FA' : 'Biometric 2FA Verification'}
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
            {mode === 'register' 
              ? 'Scan your fingerprint to register biometric authorization on this device.'
              : 'Provide your registered fingerprint to authorize this request.'}
          </p>
        </div>

        {/* Scan Target Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '24px 0' }}>
          <div 
            onClick={errorMsg ? handleStartSimulatedScan : handleStartRealScan}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              margin: '0 auto',
              background: scanState === 'success' 
                ? 'rgba(34, 197, 94, 0.1)' 
                : scanState === 'scanning' && !errorMsg
                  ? 'rgba(6, 182, 212, 0.1)' 
                  : scanState === 'failed'
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(30, 41, 59, 0.6)',
              border: `2px solid ${
                scanState === 'success' 
                  ? '#22c55e' 
                  : scanState === 'scanning' && !errorMsg
                    ? '#06b6d4' 
                    : scanState === 'failed'
                      ? '#ef4444'
                      : '#334155'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: scanState === 'scanning' || scanState === 'success' ? 'default' : 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Simulated progress overlay */}
            {scanState === 'scanning' && !errorMsg && (
              <div style={{
                position: 'absolute',
                top: `${100 - progress}%`,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(6, 182, 212, 0.25)',
                transition: 'top 0.1s linear',
                pointerEvents: 'none'
              }} />
            )}

            {scanState === 'success' ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            ) : scanState === 'failed' && errorMsg ? (
              <AlertCircle className="w-12 h-12 text-red-500" />
            ) : (
              <Fingerprint 
                className={`w-12 h-12 ${
                  scanState === 'scanning' 
                    ? 'text-cyan-400 animate-pulse' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                style={{ transition: 'color 0.2s' }}
              />
            )}
          </div>

          {/* Progress / Status Text */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: scanState === 'success' ? '#22c55e' : scanState === 'scanning' ? '#06b6d4' : scanState === 'failed' ? '#ef4444' : '#94a3b8' 
            }}>
              {scanState === 'idle' && 'Click the sensor to authenticate'}
              {scanState === 'scanning' && (progress > 0 ? `Verifying... ${progress}%` : 'Waiting for system prompt...')}
              {scanState === 'success' && 'Biometric Verification Successful'}
              {scanState === 'failed' && 'Authentication failed'}
            </p>
          </div>
        </div>

        {/* Error/Notice Message */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'start',
            gap: '8px',
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            fontSize: '12px',
            color: '#fca5a5',
            marginBottom: '16px'
          }}>
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <div>
              <p style={{ fontWeight: 600, color: '#fca5a5', marginBottom: '2px' }}>Device scan unavailable</p>
              <p style={{ color: '#94a3b8', lineHeight: 1.4 }}>{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleStartRealScan}
            disabled={scanState === 'scanning' || scanState === 'success'}
            style={{
              width: '100%',
              background: scanState === 'success' 
                ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: scanState === 'scanning' || scanState === 'success' ? 'default' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {scanState === 'scanning' && !errorMsg ? 'Verifying with system auth...' : 'Trigger Device Biometrics (Touch ID)'}
          </button>

          {/* Fallback button if real scan fails/not available */}
          {(errorMsg || !isRealAuthnSupported) && (
            <button
              onClick={handleStartSimulatedScan}
              disabled={scanState === 'scanning' || scanState === 'success'}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                color: '#94a3b8',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: scanState === 'scanning' || scanState === 'success' ? 'default' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (scanState === 'idle' || scanState === 'failed') {
                  e.currentTarget.style.borderColor = '#475569'
                  e.currentTarget.style.color = '#f1f5f9'
                }
              }}
              onMouseLeave={(e) => {
                if (scanState === 'idle' || scanState === 'failed') {
                  e.currentTarget.style.borderColor = '#334155'
                  e.currentTarget.style.color = '#94a3b8'
                }
              }}
            >
              Bypass / Use Simulated Scan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FingerprintModal
