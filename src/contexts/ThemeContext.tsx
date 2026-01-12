'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type ThemePreset = 'light' | 'dark' | 'violet' | 'rose' | 'blue' | 'green' | 'orange' | 'zinc'
type ThemeMode = 'light' | 'dark' | 'color'

interface ThemeContextType {
  theme: ThemePreset
  mode: ThemeMode
  accentColor: string
  setThemePreset: (theme: ThemePreset) => void
  toggleMode: () => void
  setAccentColor: (color: string) => void
  applyCustomAccent: (color: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemePreset>('violet')
  const [mode, setMode] = useState<ThemeMode>('dark')
  const [accentColor, setAccentColorState] = useState<string>('#8b5cf6')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load theme from server or localStorage
    fetchUserTheme()
    setMounted(true)
  }, [])

  const fetchUserTheme = async () => {
    try {
      const res = await fetch('/api/user/theme')
      if (res.ok) {
        const data = await res.json()
        const userTheme = data.theme || 'violet'
        const userAccent = data.accentColor || '#8b5cf6'
        const savedMode = (localStorage.getItem('themeMode') as ThemeMode) || 'dark'
        
        setTheme(userTheme)
        setAccentColorState(userAccent)
        setMode(savedMode)
        applyTheme(userTheme, savedMode)
        applyCustomAccent(userAccent)
      } else {
        // Fallback to localStorage
        const savedTheme = (localStorage.getItem('colorTheme') as ThemePreset) || 'violet'
        const savedMode = (localStorage.getItem('themeMode') as ThemeMode) || 'dark'
        const savedAccent = localStorage.getItem('accentColor') || '#8b5cf6'
        
        setTheme(savedTheme)
        setMode(savedMode)
        setAccentColorState(savedAccent)
        applyTheme(savedTheme, savedMode)
        applyCustomAccent(savedAccent)
      }
    } catch (error) {
      console.error('Failed to fetch theme:', error)
      const savedTheme = (localStorage.getItem('colorTheme') as ThemePreset) || 'violet'
      const savedMode = (localStorage.getItem('themeMode') as ThemeMode) || 'dark'
      const savedAccent = localStorage.getItem('accentColor') || '#8b5cf6'
      setTheme(savedTheme)
      setMode(savedMode)
      setAccentColorState(savedAccent)
      applyTheme(savedTheme, savedMode)
      applyCustomAccent(savedAccent)
    }
  }

  const applyTheme = (colorTheme: ThemePreset, currentMode: ThemeMode) => {
    const html = document.documentElement
    
    // Remove all theme classes
    html.classList.remove('dark', 'theme-violet', 'theme-rose', 'theme-blue', 'theme-green', 'theme-orange', 'theme-zinc')
    
    // Apply mode or color theme
    if (currentMode === 'dark') {
      html.classList.add('dark')
    } else if (currentMode === 'light') {
      // Light mode (no class needed, :root styles apply)
    } else if (currentMode === 'color') {
      html.classList.add(`theme-${colorTheme}`)
    }
    
    localStorage.setItem('colorTheme', colorTheme)
    localStorage.setItem('themeMode', currentMode)
  }

  const applyCustomAccent = (color: string) => {
    const html = document.documentElement
    html.style.setProperty('--primary', color)
    localStorage.setItem('accentColor', color)
  }

  const toggleMode = () => {
    // Cycle: dark → light → color
    const modes: ThemeMode[] = ['dark', 'light', 'color']
    const currentIndex = modes.indexOf(mode)
    const newMode = modes[(currentIndex + 1) % modes.length]
    
    setMode(newMode)
    applyTheme(theme, newMode)
    localStorage.setItem('themeMode', newMode)
  }

  const setThemePreset = async (newTheme: ThemePreset) => {
    setTheme(newTheme)
    applyTheme(newTheme, mode)
    
    // Save to server
    try {
      await fetch('/api/user/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      })
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  }

  const setAccentColor = async (color: string) => {
    setAccentColorState(color)
    applyCustomAccent(color)
    
    // Save to server
    try {
      await fetch('/api/user/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accentColor: color }),
      })
    } catch (error) {
      console.error('Failed to save accent color:', error)
    }
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, mode, accentColor, setThemePreset, toggleMode, setAccentColor, applyCustomAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    // Return default values instead of throwing error during SSR
    return {
      theme: 'violet' as ThemePreset,
      mode: 'dark' as ThemeMode,
      accentColor: '#8b5cf6',
      setThemePreset: () => {},
      toggleMode: () => {},
      setAccentColor: () => {},
      applyCustomAccent: () => {},
    }
  }
  return context
}
