'use client'

import React from 'react'

/* ============================================
   FILE 5: Card Component
   Clean dark card with border
   Optional: header, footer, hover effect,
   colored left border (pass borderAccent prop)
   ============================================ */

interface CardProps {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  hover?: boolean
  borderAccent?: string  // e.g. '#3b82f6' for left colored border
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  id?: string
}

export default function Card({
  children,
  header,
  footer,
  hover = false,
  borderAccent,
  className = '',
  style,
  onClick,
  id
}: CardProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const cardStyle: React.CSSProperties = {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    ...(borderAccent ? { borderLeft: `3px solid ${borderAccent}` } : {}),
    ...(hover && isHovered
      ? {
          borderColor: '#475569',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
        }
      : {}),
    ...(onClick ? { cursor: 'pointer' } : {}),
    ...style
  }

  return (
    <div
      id={id}
      className={className}
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {header && (
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {header}
        </div>
      )}

      <div style={{ padding: '20px' }}>
        {children}
      </div>

      {footer && (
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #334155',
            background: 'rgba(15, 23, 42, 0.4)'
          }}
        >
          {footer}
        </div>
      )}
    </div>
  )
}
