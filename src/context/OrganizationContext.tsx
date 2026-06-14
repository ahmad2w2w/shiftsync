import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Organization, OrgPlan } from '../types/database'
import { normalizeOrgPlan, PRICE_PER_EMPLOYEE, PRODUCT } from '../types/database'

interface OrganizationContextValue {
  organization: Organization | null
  loading: boolean
  plan: OrgPlan
  isSubscribed: boolean
  pricePerEmployee: number
  hasFeature: (_feature: 'planner' | 'export' | 'notifications' | 'gps') => boolean
  refreshOrganization: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(false)

  const loadOrganization = useCallback(async (orgId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()
      if (error) throw error
      setOrganization(data as Organization)
    } catch {
      setOrganization(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshOrganization = useCallback(async () => {
    if (profile?.organization_id) await loadOrganization(profile.organization_id)
  }, [profile?.organization_id, loadOrganization])

  useEffect(() => {
    if (profile?.organization_id) {
      loadOrganization(profile.organization_id)
    } else {
      setOrganization(null)
    }
  }, [profile?.organization_id, loadOrganization])

  const plan: OrgPlan = normalizeOrgPlan(organization?.plan)
  const isSubscribed = plan === 'active' || !!organization?.stripe_subscription_id

  const value = useMemo(
    () => ({
      organization,
      loading,
      plan,
      isSubscribed,
      pricePerEmployee: PRICE_PER_EMPLOYEE,
      hasFeature: () => true,
      refreshOrganization,
    }),
    [organization, loading, plan, isSubscribed, refreshOrganization]
  )

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext)
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider')
  return ctx
}

export { PRODUCT }
