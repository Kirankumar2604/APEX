'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface BackgroundComponentsProps {
  children?: ReactNode
  className?: string
}

export const Component = ({ children, className }: BackgroundComponentsProps) => {
  return (
    <div className={cn('app-background min-h-screen w-full relative bg-white overflow-hidden', className)}>
      {/* Soft Yellow Glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, #FFF991 0%, transparent 70%)
          `,
          opacity: 0.6,
          mixBlendMode: 'multiply',
        }}
      />
      {/* Noise Texture (Darker Dots) Background */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.35) 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="app-background-content relative z-20 min-h-screen">
        {children}
      </div>
    </div>
  )
}

export default Component
