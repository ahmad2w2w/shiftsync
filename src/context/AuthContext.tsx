import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User as AuthUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { ensureUserProfile } from '../services/users'
import type { User } from '../types/database'

interface AuthContextValue {
  session: Session | null
  authUser: AuthUser | null
  profile: User | null
  loading: boolean
  isAdmin: boolean
  needsOnboarding: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (user: AuthUser) => {
    const data = await ensureUserProfile(user)
    setProfile(data)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (authUser) await loadProfile(authUser)
  }, [authUser, loadProfile])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setAuthUser(s?.user ?? null)
      if (s?.user) {
        loadProfile(s.user).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setAuthUser(s?.user ?? null)
      if (s?.user) {
        loadProfile(s.user)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      authUser,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      needsOnboarding: !!profile && !profile.organization_id,
      signIn,
      signOut,
      refreshProfile,
    }),
    [session, authUser, profile, loading, signIn, signOut, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
