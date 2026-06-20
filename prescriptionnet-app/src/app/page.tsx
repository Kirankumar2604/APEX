'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Stethoscope,
  Building2,
  Shield,
  Lock,
  Fingerprint,
  Brain,
  ChevronDown,
  ArrowRight,
  Activity,
  Zap,
  Mail,
  KeyRound
} from 'lucide-react'
import { MOCK_USERS, getAllUsers } from '@/data/mockData'
import type { UserRole, User as UserType } from '@/types'
import { hasKeyPair } from '@/lib/keystore'
import KeypairSetup from '@/components/crypto/KeypairSetup'
import FingerprintModal from '@/components/crypto/FingerprintModal'
import { 
  auth, 
  googleProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from '@/lib/firebase'

/* ============================================
   FILE 3: Login Page — Full-screen dark landing
   ============================================ */

interface RoleCardConfig {
  role: UserRole
  icon: React.ElementType
  title: string
  description: string
  color: string
  glowColor: string
  bgGradient: string
}

const ROLE_CARDS: RoleCardConfig[] = [
  {
    role: 'patient',
    icon: User,
    title: 'Patient',
    description: 'Own and control your medical vault',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02))'
  },
  {
    role: 'doctor',
    icon: Stethoscope,
    title: 'Doctor',
    description: 'Access authorized patient records',
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.02))'
  },
  {
    role: 'requester',
    icon: Building2,
    title: 'Requester',
    description: 'Request verified health data',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(6, 182, 212, 0.02))'
  }
]

const SECURITY_BADGES = [
  { icon: Lock, label: 'AES-256-GCM Encrypted' },
  { icon: Fingerprint, label: 'ECDSA Signed' },
  { icon: Shield, label: 'Zero Knowledge' },
  { icon: Brain, label: 'AI Protected' }
]

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showKeySetup, setShowKeySetup] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<UserType | null>(null)
  const [users, setUsers] = useState<UserType[]>([])
  const [biometricLoginUser, setBiometricLoginUser] = useState<UserType | null>(null)

  // Firebase Auth states
  const [authTab, setAuthTab] = useState<'signin' | 'register' | 'mock'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authError, setAuthError] = useState('')

  const refreshUsers = () => {
    if (typeof window !== 'undefined') {
      const storedUsers = getAllUsers()
      setUsers(storedUsers)
    }
  }

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      // Initialize mock data in localStorage if not present
      if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(MOCK_USERS))
      }
      if (!localStorage.getItem('prescriptionnet_users')) {
        localStorage.setItem('prescriptionnet_users', JSON.stringify(MOCK_USERS))
      }
      refreshUsers()
    }
  }, [])

  const filteredUsers = users.filter(u => u.role === selectedRole)

  const redirectUser = (user: UserType) => {
    switch (user.role) {
      case 'patient':
        router.push('/patient')
        break
      case 'doctor':
        router.push('/doctor')
        break
      case 'requester':
        router.push('/requester')
        break
    }
  }

  const proceedWithLoginRedirect = (user: UserType) => {
    if (!hasKeyPair(user.id)) {
      setLoggedInUser(user)
      setShowKeySetup(true)
      setIsLoggingIn(false)
    } else {
      redirectUser(user)
    }
  }

  const checkBiometricAndRedirect = (user: UserType) => {
    const isBiometricActive = localStorage.getItem(`prescriptionnet_biometric_2fa_${user.id}`) === 'true' || 
                             (user.role === 'patient' && localStorage.getItem('prescriptionnet_biometric_2fa') === 'true')
    
    if (isBiometricActive) {
      setBiometricLoginUser(user)
      setIsLoggingIn(false)
    } else {
      proceedWithLoginRedirect(user)
    }
  }

  const handleLogin = () => {
    if (!selectedUserId) return
    const user = users.find(u => u.id === selectedUserId)
    if (!user) return

    setIsLoggingIn(true)
    localStorage.setItem('prescriptionnet_currentUser', JSON.stringify(user))

    setTimeout(() => {
      checkBiometricAndRedirect(user)
    }, 800)
  }

  const handleGoogleLogin = async () => {
    if (!selectedRole) return
    setIsLoggingIn(true)
    setAuthError('')
    try {
      const credentials = await signInWithPopup(auth, googleProvider)
      const firebaseUser = credentials.user

      const currentUsers = getAllUsers()
      let userObj = currentUsers.find((u: UserType) => u.email === firebaseUser.email || u.id === firebaseUser.uid)

      if (!userObj) {
        userObj = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Google User',
          role: selectedRole,
          email: firebaseUser.email || '',
          publicKey: '',
          createdAt: new Date().toISOString()
        }
        const updatedUsers = [...currentUsers, userObj]
        localStorage.setItem('users', JSON.stringify(updatedUsers))
        localStorage.setItem('prescriptionnet_users', JSON.stringify(updatedUsers))
        refreshUsers()

        if (selectedRole === 'patient') {
          const vaultObj = {
            patientId: userObj.id,
            patientName: userObj.name,
            dateOfBirth: '1990-01-01',
            bloodGroup: 'O+',
            allergies: [],
            conditions: [],
            prescriptions: [],
            labReports: [],
            medicationHistory: [],
            emergencyAccessEnabled: false,
            updatedAt: new Date().toISOString()
          }
          localStorage.setItem(`vault_${userObj.id}`, JSON.stringify(vaultObj))
        }
      } else if (userObj.role !== selectedRole) {
        userObj.role = selectedRole
        localStorage.setItem('users', JSON.stringify(currentUsers))
        localStorage.setItem('prescriptionnet_users', JSON.stringify(currentUsers))
        refreshUsers()
      }

      localStorage.setItem('prescriptionnet_currentUser', JSON.stringify(userObj))

      setTimeout(() => {
        checkBiometricAndRedirect(userObj!)
      }, 800)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Google Sign-In failed.'
      setAuthError(errMsg)
      setIsLoggingIn(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !selectedRole) {
      setAuthError('Please fill out all fields.')
      return
    }
    setIsLoggingIn(true)
    setAuthError('')
    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = credentials.user

      const currentUsers = getAllUsers()
      let userObj = currentUsers.find((u: UserType) => u.email === firebaseUser.email || u.id === firebaseUser.uid)

      if (!userObj) {
        userObj = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || email.split('@')[0],
          role: selectedRole,
          email: firebaseUser.email || email,
          publicKey: '',
          createdAt: new Date().toISOString()
        }
        const updatedUsers = [...currentUsers, userObj]
        localStorage.setItem('users', JSON.stringify(updatedUsers))
        localStorage.setItem('prescriptionnet_users', JSON.stringify(updatedUsers))
        refreshUsers()

        if (selectedRole === 'patient') {
          const vaultObj = {
            patientId: userObj.id,
            patientName: userObj.name,
            dateOfBirth: '1990-01-01',
            bloodGroup: 'O+',
            allergies: [],
            conditions: [],
            prescriptions: [],
            labReports: [],
            medicationHistory: [],
            emergencyAccessEnabled: false,
            updatedAt: new Date().toISOString()
          }
          localStorage.setItem(`vault_${userObj.id}`, JSON.stringify(vaultObj))
        }
      } else if (userObj.role !== selectedRole) {
        userObj.role = selectedRole
        localStorage.setItem('users', JSON.stringify(currentUsers))
        localStorage.setItem('prescriptionnet_users', JSON.stringify(currentUsers))
        refreshUsers()
      }

      localStorage.setItem('prescriptionnet_currentUser', JSON.stringify(userObj))

      setTimeout(() => {
        checkBiometricAndRedirect(userObj!)
      }, 800)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Email Sign In failed.'
      setAuthError(errMsg)
      setIsLoggingIn(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !fullName || !selectedRole) {
      setAuthError('Please fill out all fields.')
      return
    }
    setIsLoggingIn(true)
    setAuthError('')
    try {
      const credentials = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = credentials.user

      const newUser: UserType = {
        id: firebaseUser.uid,
        name: fullName,
        role: selectedRole,
        email: firebaseUser.email || email,
        publicKey: '',
        createdAt: new Date().toISOString()
      }

      const currentUsers = getAllUsers()
      const updatedUsers = [...currentUsers, newUser]
      localStorage.setItem('users', JSON.stringify(updatedUsers))
      localStorage.setItem('prescriptionnet_users', JSON.stringify(updatedUsers))
      refreshUsers()

      if (selectedRole === 'patient') {
        const vaultObj = {
          patientId: newUser.id,
          patientName: newUser.name,
          dateOfBirth: '1990-01-01',
          bloodGroup: 'O+',
          allergies: [],
          conditions: [],
          prescriptions: [],
          labReports: [],
          medicationHistory: [],
          emergencyAccessEnabled: false,
          updatedAt: new Date().toISOString()
        }
        localStorage.setItem(`vault_${newUser.id}`, JSON.stringify(vaultObj))
      }

      localStorage.setItem('prescriptionnet_currentUser', JSON.stringify(newUser))

      setTimeout(() => {
        if (!hasKeyPair(newUser.id)) {
          setLoggedInUser(newUser)
          setShowKeySetup(true)
          setIsLoggingIn(false)
        } else {
          redirectUser(newUser)
        }
      }, 800)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Registration failed.'
      setAuthError(errMsg)
      setIsLoggingIn(false)
    }
  }

  const selectedUser = users.find(u => u.id === selectedUserId)

  return (
    <div className="min-h-screen animated-bg grid-pattern relative overflow-hidden flex flex-col">
      {/* Decorative orbs */}
      <div
        className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10 blur-[80px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        {/* Logo & Title */}
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse-glow bg-gradient-to-r from-blue-600 to-cyan-500"
              style={{
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)'
              }}
            >
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="gradient-text">Prescription</span>
              <span className="text-white">Net</span>
            </h1>
          </div>
          <p className="text-lg md:text-xl text-slate-400 max-w-lg mx-auto leading-relaxed">
            Your Health Data. Your Control.{' '}
            <span className="text-cyan-400 font-medium">Your Signature.</span>
          </p>
        </div>

        {/* Role Cards */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl w-full mb-10 transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon
            const isSelected = selectedRole === card.role
            return (
              <button
                key={card.role}
                id={`role-card-${card.role}`}
                onClick={() => {
                  setSelectedRole(card.role)
                  setSelectedUserId('')
                  setIsDropdownOpen(false)
                }}
                className="group relative rounded-2xl p-6 text-left transition-all duration-300 border cursor-pointer"
                style={{
                  background: isSelected ? card.bgGradient : '#1e293b',
                  borderColor: isSelected ? card.color : '#334155',
                  boxShadow: isSelected
                    ? `0 0 30px ${card.glowColor}, 0 8px 32px rgba(0,0,0,0.3)`
                    : '0 2px 8px rgba(0,0,0,0.2)',
                  transform: isSelected ? 'translateY(-4px)' : 'translateY(0)'
                }}
              >
                {/* Active indicator */}
                {isSelected && (
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
                    style={{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }}
                  />
                )}

                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${card.color}20, ${card.color}10)`
                      : '#0f172a',
                    border: `1px solid ${isSelected ? card.color + '40' : '#334155'}`
                  }}
                >
                  <Icon
                    className="w-6 h-6 transition-colors duration-300"
                    style={{ color: isSelected ? card.color : '#94a3b8' }}
                  />
                </div>
                <h3
                  className="text-lg font-semibold mb-1 transition-colors duration-300"
                  style={{ color: isSelected ? card.color : '#f1f5f9' }}
                >
                  {card.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {card.description}
                </p>

                {/* Hover glow effect */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 40px ${card.glowColor}`
                  }}
                />
              </button>
            )
          })}
        </div>

        {/* Login Form (appears below selected role) */}
        {selectedRole && (
          <div className="w-full max-w-md animate-fade-in-up">
            <div
              className="rounded-2xl p-6 border flex flex-col gap-4"
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(16px)',
                borderColor: '#334155'
              }}
            >
              {/* Tab Selector */}
              <div className="flex bg-[#0f172a] p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setAuthTab('signin'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    authTab === 'signin'
                      ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    authTab === 'register'
                      ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('mock'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    authTab === 'mock'
                      ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mock Accounts
                </button>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-0.5">
                  {authTab === 'signin' && 'Sign In'}
                  {authTab === 'register' && 'Create Account'}
                  {authTab === 'mock' && 'Developer Mock Sign In'}
                  {' '}as{' '}
                  <span
                    style={{
                      color: ROLE_CARDS.find(c => c.role === selectedRole)?.color
                    }}
                  >
                    {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {authTab === 'signin' && 'Log in using Google OAuth or your Email & Password'}
                  {authTab === 'register' && 'Register a new authenticated profile'}
                  {authTab === 'mock' && 'Sign in instantly with a preloaded testing vault'}
                </p>
              </div>

              {authError && (
                <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 px-3 py-2.5 rounded-xl">
                  {authError}
                </div>
              )}

              {/* Tab 1: Sign In */}
              {authTab === 'signin' && (
                <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
                  <div>
                    <label className="data-label block mb-1 text-[11px] uppercase tracking-wider text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-[#0f172a] text-sm text-white focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="data-label block mb-1 text-[11px] uppercase tracking-wider text-slate-400">Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-[#0f172a] text-sm text-white focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition-all bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50"
                  >
                    {isLoggingIn ? 'Signing In...' : 'Sign In'}
                  </button>

                  <div className="relative my-2 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <span className="relative px-3 bg-[#1e293b]/80 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Or</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold border border-slate-700 bg-[#0f172a] text-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.12h4.03c2.36-2.17 3.72-5.38 3.72-8.74z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3.01c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-4.99H1.14v3.2A11.98 11.98 0 0 0 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.24 14.25A7.12 7.12 0 0 1 4.87 12c0-.79.13-1.57.37-2.25V6.55H1.14A11.98 11.98 0 0 0 0 12c0 2.02.5 3.92 1.4 5.6l3.84-3.35z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0A11.98 11.98 0 0 0 1.14 6.55l4.1 3.2C6.19 6.88 8.85 4.75 12 4.75z"
                      />
                    </svg>
                    Sign In with Google
                  </button>
                </form>
              )}

              {/* Tab 2: Register */}
              {authTab === 'register' && (
                <form onSubmit={handleEmailSignUp} className="flex flex-col gap-3">
                  <div>
                    <label className="data-label block mb-1 text-[11px] uppercase tracking-wider text-slate-400">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-[#0f172a] text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="data-label block mb-1 text-[11px] uppercase tracking-wider text-slate-400">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-[#0f172a] text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="data-label block mb-1 text-[11px] uppercase tracking-wider text-slate-400">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="•••••••• (Min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-[#0f172a] text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition-all bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50"
                  >
                    {isLoggingIn ? 'Registering...' : 'Register & Log In'}
                  </button>

                  <div className="relative my-2 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <span className="relative px-3 bg-[#1e293b]/80 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Or</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold border border-slate-700 bg-[#0f172a] text-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.12h4.03c2.36-2.17 3.72-5.38 3.72-8.74z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3.01c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-4.99H1.14v3.2A11.98 11.98 0 0 0 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.24 14.25A7.12 7.12 0 0 1 4.87 12c0-.79.13-1.57.37-2.25V6.55H1.14A11.98 11.98 0 0 0 0 12c0 2.02.5 3.92 1.4 5.6l3.84-3.35z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0A11.98 11.98 0 0 0 1.14 6.55l4.1 3.2C6.19 6.88 8.85 4.75 12 4.75z"
                      />
                    </svg>
                    Register with Google
                  </button>
                </form>
              )}

              {/* Tab 3: Mock Accounts */}
              {authTab === 'mock' && (
                <div className="flex flex-col gap-4">
                  {/* Custom Dropdown */}
                  <div className="relative">
                    <label className="data-label block mb-2 text-[11px] uppercase tracking-wider text-slate-400">Select Mock User</label>
                    <button
                      id="user-dropdown-trigger"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 text-left"
                      style={{
                        background: '#0f172a',
                        borderColor: isDropdownOpen ? '#3b82f6' : '#334155',
                        boxShadow: isDropdownOpen ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none'
                      }}
                    >
                      <span className={selectedUser ? 'text-white' : 'text-slate-500'}>
                        {selectedUser ? selectedUser.name : 'Choose a mock account...'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isDropdownOpen && (
                      <div
                        className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden z-50 animate-slide-down"
                        style={{
                          background: '#1e293b',
                          borderColor: '#334155',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.4)'
                        }}
                      >
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            id={`user-option-${user.id}`}
                            onClick={() => {
                              setSelectedUserId(user.id)
                              setIsDropdownOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-slate-700/50"
                            style={{
                              background: selectedUserId === user.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold"
                              style={{
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#3b82f6'
                              }}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{user.name}</p>
                              <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Login Button */}
                  <button
                    id="login-button"
                    onClick={handleLogin}
                    disabled={!selectedUserId || isLoggingIn}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: selectedUserId
                        ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                        : '#334155',
                      boxShadow: selectedUserId
                        ? '0 4px 20px rgba(59, 130, 246, 0.3)'
                        : 'none'
                    }}
                  >
                    {isLoggingIn ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        <span>Enter PrescriptionNet</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Security Badges */}
      <footer
        className={`py-8 px-4 relative z-10 transition-all duration-700 delay-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {SECURITY_BADGES.map((badge) => {
            const Icon = badge.icon
            return (
              <div
                key={badge.label}
                className="flex items-center gap-2 text-slate-500 group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/50 border border-slate-700/50 group-hover:border-slate-600 transition-colors duration-200">
                  <Icon className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors duration-200" />
                </div>
                <span className="text-xs font-medium tracking-wide uppercase group-hover:text-slate-400 transition-colors duration-200">
                  {badge.label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-600">
            Built for patient sovereignty • Hackathon 2024
          </p>
        </div>
      </footer>

      {/* Keypair Setup Overlay */}
      {showKeySetup && loggedInUser && (
        <KeypairSetup
          userId={loggedInUser.id}
          onComplete={() => {
            setShowKeySetup(false)
            redirectUser(loggedInUser)
          }}
        />
      )}

      {/* Biometric Login Verification Modal */}
      {biometricLoginUser && (
        <FingerprintModal
          mode="verify"
          patientId={biometricLoginUser.id}
          patientName={biometricLoginUser.name}
          onSuccess={() => {
            const userToRedirect = biometricLoginUser
            setBiometricLoginUser(null)
            sessionStorage.setItem(`prescriptionnet_biometric_verified_${userToRedirect.id}`, 'true')
            proceedWithLoginRedirect(userToRedirect)
          }}
          onCancel={() => {
            setBiometricLoginUser(null)
            localStorage.removeItem('prescriptionnet_currentUser')
          }}
        />
      )}
    </div>
  )
}
