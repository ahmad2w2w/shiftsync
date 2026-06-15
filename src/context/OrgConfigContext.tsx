import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getPositions } from '../services/positions'
import { getDepartments } from '../services/departments'
import { getLeaveTypes } from '../services/leaveTypes'
import { registerPositionColors, SHIFT_POSITIONS } from '../lib/utils'
import { useOrganization } from './OrganizationContext'
import type { Department, LeaveType, Position } from '../types/database'

interface OrgConfigValue {
  positions: Position[]
  departments: Department[]
  leaveTypes: LeaveType[]
  /** Select options for shift positions; falls back to the built-in defaults. */
  positionOptions: { value: string; label: string }[]
  loading: boolean
  refresh: () => Promise<void>
}

const OrgConfigContext = createContext<OrgConfigValue | null>(null)

export function OrgConfigProvider({ children }: { children: ReactNode }) {
  const { organization } = useOrganization()
  const [positions, setPositions] = useState<Position[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!organization) return
    setLoading(true)
    try {
      const [p, d, l] = await Promise.all([
        getPositions().catch(() => []),
        getDepartments().catch(() => []),
        getLeaveTypes().catch(() => []),
      ])
      setPositions(p)
      setDepartments(d)
      setLeaveTypes(l)
      registerPositionColors(p.map((x) => ({ name: x.name, color: x.color })))
    } finally {
      setLoading(false)
    }
  }, [organization])

  useEffect(() => {
    if (organization) refresh()
    else setLoading(false)
  }, [organization, refresh])

  const positionOptions = useMemo(() => {
    if (positions.length === 0) return [...SHIFT_POSITIONS]
    return positions.map((p) => ({ value: p.name, label: p.name }))
  }, [positions])

  const value = useMemo<OrgConfigValue>(
    () => ({ positions, departments, leaveTypes, positionOptions, loading, refresh }),
    [positions, departments, leaveTypes, positionOptions, loading, refresh]
  )

  return <OrgConfigContext.Provider value={value}>{children}</OrgConfigContext.Provider>
}

export function useOrgConfig() {
  const ctx = useContext(OrgConfigContext)
  if (!ctx) throw new Error('useOrgConfig must be used within OrgConfigProvider')
  return ctx
}
