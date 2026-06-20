'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { auth, signOut } from '@/lib/firebase'
import {
  Activity,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Bell,
  BookOpen,
  Users,
  Search,
  ClipboardList
} from 'lucide-react'
import Badge from '@/components/ui/Badge'
import type { User, UserRole } from '@/types'

/* ============================================
   FILE 8: Navbar Component
   Shows current user name + role badge
   PrescriptionNet logo left
   Navigation links for current role
   Logout button right
   Role-colored accent line at top
   ============================================ */

interface NavLink {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_LINKS: Record<UserRole, NavLink[]> = {
  patient: [
    { label: 'Dashboard', href: '/patient', icon: LayoutDashboard },
    { label: 'My Vault', href: '/patient/vault', icon: ShieldCheck },
    { label: 'Consents', href: '/patient/consents', icon: FileText },
    { label: 'Requests', href: '/patient/requests', icon: Bell },
    { label: 'Ledger', href: '/patient/ledger', icon: BookOpen }
  ],
  doctor: [
    { label: 'Dashboard', href: '/doctor', icon: LayoutDashboard },
    { label: 'Patients', href: '/doctor/patients', icon: Users },
    { label: 'Request Access', href: '/doctor/request', icon: Search },
    { label: 'Safety', href: '/doctor/safety', icon: ShieldCheck },
    { label: 'Ledger', href: '/doctor/ledger', icon: BookOpen }
  ],
  requester: [
    { label: 'Dashboard', href: '/requester', icon: LayoutDashboard },
    { label: 'Requests', href: '/requester/requests', icon: ClipboardList },
    { label: 'New Request', href: '/requester/new', icon: Search },
    { label: 'Ledger', href: '/requester/ledger', icon: BookOpen }
  ]
}

const ROLE_COLORS: Record<UserRole, string> = {
  patient: '#3b82f6',
  doctor: '#22c55e',
  requester: '#06b6d4'
}

const ROLE_BADGE_VARIANT: Record<UserRole, 'info' | 'success' | 'neutral'> = {
  patient: 'info',
  doctor: 'success',
  requester: 'neutral'
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('prescriptionnet_currentUser')
    if (stored) {
      setCurrentUser(JSON.parse(stored))
    }
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch {
      // Ignore auth logout errors.
    }
    localStorage.removeItem('prescriptionnet_currentUser')
    router.push('/')
  }

  if (!currentUser) return null

  const roleColor = ROLE_COLORS[currentUser.role]
  const navLinks = NAV_LINKS[currentUser.role]

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 40 }}>
      {/* Role-colored accent line at top */}
      <div
        style={{
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${roleColor}, ${roleColor}80, transparent)`
        }}
      />

      {/* Main navbar */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #1e293b',
          padding: '0 24px'
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px'
          }}
        >
          {/* Left: Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              flexShrink: 0
            }}
            onClick={() => router.push(`/${currentUser.role}`)}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${roleColor}, ${roleColor}80)`,
                boxShadow: `0 0 15px ${roleColor}30`
              }}
            >
              <Activity className="w-[18px] h-[18px] text-white" />
            </div>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#f1f5f9',
                letterSpacing: '-0.01em'
              }}
            >
              Prescription<span style={{ color: roleColor }}>Net</span>
            </span>
          </div>

          {/* Center: Nav Links (hidden on mobile) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
            className="hidden md:flex"
          >
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <button
                  key={link.href}
                  id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => router.push(link.href)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? roleColor : '#94a3b8',
                    background: isActive ? `${roleColor}12` : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                    whiteSpace: 'nowrap' as const
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#f1f5f9'
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#94a3b8'
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              )
            })}
          </div>

          {/* Right: User info + Logout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexShrink: 0
            }}
          >
            {/* User badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              className="hidden sm:flex"
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${roleColor}15`,
                  border: `1px solid ${roleColor}30`,
                  fontSize: '13px',
                  fontWeight: 700,
                  color: roleColor
                }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#f1f5f9',
                    lineHeight: 1.2
                  }}
                >
                  {currentUser.name}
                </span>
                <Badge
                  variant={ROLE_BADGE_VARIANT[currentUser.role]}
                  size="sm"
                  dot
                >
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Logout */}
            <button
              id="logout-button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#94a3b8',
                background: 'transparent',
                border: '1px solid #334155',
                cursor: 'pointer',
                transition: 'all 200ms'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8'
                e.currentTarget.style.borderColor = '#334155'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
