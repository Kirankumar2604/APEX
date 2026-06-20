'use client'

import React, { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

/* ============================================
   FILE 7: Modal Component
   Dark overlay, animated slide-in,
   close on backdrop click, close button top-right,
   title + children + optional footer
   ============================================ */

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: string
  id?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '500px',
  id
}: ModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div
      id={id}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className="relative w-full"
        style={{
          maxWidth,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
          animation: 'fadeInUp 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#f1f5f9',
              margin: 0
            }}
          >
            {title}
          </h2>
          <button
            id="modal-close-button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(148, 163, 184, 0.08)',
              border: '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 200ms',
              color: '#94a3b8'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              e.currentTarget.style.color = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)'
              e.currentTarget.style.borderColor = '#334155'
              e.currentTarget.style.color = '#94a3b8'
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #334155',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '0 0 20px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              flexShrink: 0
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
