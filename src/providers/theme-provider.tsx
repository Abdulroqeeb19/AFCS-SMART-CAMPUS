'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('afcs-theme') as Theme | null
    if (stored) {
      setThemeState(stored)
      document.documentElement.setAttribute('data-theme', stored)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeState('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  const applyTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('afcs-theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  const toggleTheme = () => applyTheme(theme === 'light' ? 'dark' : 'light')

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
