'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'prescriptionnet_theme'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const storedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null
    const initialTheme = storedTheme === 'dark' ? 'dark' : 'light'

    setTheme(initialTheme)
    document.documentElement.dataset.theme = initialTheme
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'

    setTheme(nextTheme)
    localStorage.setItem(STORAGE_KEY, nextTheme)
    document.documentElement.dataset.theme = nextTheme
  }

  const Icon = theme === 'light' ? Moon : Sun
  const label = theme === 'light' ? 'Dark theme' : 'Light theme'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${label}`}
      title={`Switch to ${label}`}
    >
      <Icon className="h-4 w-4" />
      <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
    </button>
  )
}
