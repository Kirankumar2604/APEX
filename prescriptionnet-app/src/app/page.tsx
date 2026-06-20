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
  Zap
} from 'lucide-react'
import { MOCK_USERS } from '@/data/mockData'
import type { UserRole, User as UserType } from '@/types'
import { hasKeyPair } from '@/lib/keystore'
import KeypairSetup from '@/components/crypto/KeypairSetup'

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

  useEffect(() => {
    setMounted(true)
    // Initialize mock data in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('prescriptionnet_users', JSON.stringify(MOCK_USERS))
    }
  }, [])

  const filteredUsers = MOCK_USERS.filter(u => u.role === selectedRole)

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

  const handleLogin = () => {
    if (!selectedUserId) return
    const user = MOCK_USERS.find(u => u.id === selectedUserId)
    if (!user) return

    setIsLoggingIn(true)
    localStorage.setItem('prescriptionnet_currentUser', JSON.stringify(user))

    setTimeout(() => {
      if (!hasKeyPair(user.id)) {
        setLoggedInUser(user)
        setShowKeySetup(true)
        setIsLoggingIn(false)
      } else {
        redirectUser(user)
      }
    }, 800)
  }

  const selectedUser = MOCK_USERS.find(u => u.id === selectedUserId)

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
              className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse-glow"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
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
          <div
            className="w-full max-w-md animate-fade-in-up"
          >
            <div
              className="rounded-2xl p-6 border"
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(16px)',
                borderColor: '#334155'
              }}
            >
              <h3 className="text-lg font-semibold text-white mb-1">
                Sign in as{' '}
                <span
                  style={{
                    color: ROLE_CARDS.find(c => c.role === selectedRole)?.color
                  }}
                >
                  {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                </span>
              </h3>
              <p className="text-sm text-slate-400 mb-5">Select your identity to continue</p>

              {/* Custom Dropdown */}
              <div className="relative mb-5">
                <label className="data-label block mb-2">Select User</label>
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
                    {selectedUser ? selectedUser.name : 'Choose a user...'}
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
    </div>
  )
}
