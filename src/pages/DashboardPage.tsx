import { useAuth } from '../context/AuthContext'
import { EmployeeDashboard } from './EmployeeDashboard'
import { ManagerDashboard } from './ManagerDashboard'

export function DashboardPage() {
  const { isAdmin } = useAuth()
  return isAdmin ? <ManagerDashboard /> : <EmployeeDashboard />
}
