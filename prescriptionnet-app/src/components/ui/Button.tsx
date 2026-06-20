'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

/* ============================================
   FILE 4: Button Component
   Variants: primary, secondary, danger, ghost
   Sizes: sm, md, lg
   ============================================ */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#ffffff',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    boxShadow: '0 2px 12px rgba(59, 130, 246, 0.2)'
  },
  secondary: {
    background: '#1e293b',
    color: '#f1f5f9',
    border: '1px solid #334155',
    boxShadow: 'none'
  },
  danger: {
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#ffffff',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    boxShadow: '0 2px 12px rgba(239, 68, 68, 0.2)'
  },
  ghost: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid transparent',
    boxShadow: 'none'
  }
}

const variantHoverStyles: Record<string, React.CSSProperties> = {
  primary: {
    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.35)',
    transform: 'translateY(-1px)'
  },
  secondary: {
    borderColor: '#475569',
    background: '#283548'
  },
  danger: {
    boxShadow: '0 4px 20px rgba(239, 68, 68, 0.35)',
    transform: 'translateY(-1px)'
  },
  ghost: {
    background: 'rgba(148, 163, 184, 0.08)',
    color: '#f1f5f9'
  }
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3.5 text-base rounded-xl gap-2.5'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const isDisabled = disabled || loading

  const baseStyle: React.CSSProperties = {
    ...variantStyles[variant],
    ...(isHovered && !isDisabled ? variantHoverStyles[variant] : {}),
    ...(isDisabled ? { opacity: 0.5, cursor: 'not-allowed', transform: 'none' } : { cursor: 'pointer' }),
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap' as const,
    ...style
  }

  return (
    <button
      className={`${sizeClasses[size]} ${className}`}
      style={baseStyle}
      disabled={isDisabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  )
}
