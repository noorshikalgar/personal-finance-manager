'use client'

import { Moon, Sun, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle() {
  const { mode, toggleMode } = useTheme()

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'color':
        return <Palette className="h-4 w-4" />
      default:
        return <Moon className="h-4 w-4" />
    }
  }

  return (
    <Button
      onClick={toggleMode}
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      aria-label="Toggle theme"
      title={`Current: ${mode === 'dark' ? 'Dark' : mode === 'light' ? 'Light' : 'Color'} theme`}
    >
      {getIcon()}
    </Button>
  )
}
