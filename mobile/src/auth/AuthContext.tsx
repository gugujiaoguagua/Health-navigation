import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { setToken as persistToken, getToken as readToken } from '../api/client'

type AuthState = {
  token: string | null
  setToken: (token: string | null) => Promise<void>
  ready: boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const stored = await readToken()
        setTokenState(stored ?? null)
      } catch {
        setTokenState(null)
      } finally {
        setReady(true)
      }
    })()
  }, [])

  const setToken = useCallback(async (t: string | null) => {
    setTokenState(t)
    await persistToken(t)
  }, [])

  const value = useMemo(() => ({ token, setToken, ready }), [token, setToken, ready])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const v = useContext(AuthContext)
  if (!v) throw new Error('AuthProvider missing')
  return v
}

