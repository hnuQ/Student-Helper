import {
  createContext,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = Exclude<Theme, 'system'>

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  systemTheme: ResolvedTheme
  themes: Theme[]
  setTheme: (theme: SetStateAction<Theme>) => void
}

interface ThemeProviderProps {
  children: ReactNode
}

const STORAGE_KEY = 'theme'
const THEMES: Theme[] = ['light', 'dark', 'system']
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(SYSTEM_THEME_QUERY).matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme {
  try {
    const storedTheme = localStorage.getItem(STORAGE_KEY)
    return isTheme(storedTheme) ? storedTheme : 'system'
  } catch {
    return 'system'
  }
}

function applyTheme(theme: Theme, systemTheme: ResolvedTheme): void {
  const resolvedTheme = theme === 'system' ? systemTheme : theme
  const root = document.documentElement

  root.classList.remove('light', 'dark')
  root.classList.add(resolvedTheme)
  root.style.colorScheme = resolvedTheme
}

export default function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)

  useEffect(() => {
    applyTheme(theme, systemTheme)
  }, [theme, systemTheme])

  useEffect(() => {
    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY)
    const updateSystemTheme = (): void => setSystemTheme(getSystemTheme())

    updateSystemTheme()
    mediaQuery.addEventListener('change', updateSystemTheme)

    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [])

  const setTheme = useCallback((value: SetStateAction<Theme>): void => {
    setThemeState((currentTheme) => {
      const nextTheme = typeof value === 'function' ? value(currentTheme) : value

      try {
        localStorage.setItem(STORAGE_KEY, nextTheme)
      } catch {
        // Ignore storage failures and keep the in-memory theme active.
      }

      return nextTheme
    })
  }, [])

  const contextValue = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme: theme === 'system' ? systemTheme : theme,
    systemTheme,
    themes: THEMES,
    setTheme
  }), [theme, systemTheme, setTheme])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
