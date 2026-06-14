import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { ConfirmProvider } from './context/ConfirmContext'
import { AuthProvider } from './context/AuthContext'
import { OrganizationProvider } from './context/OrganizationContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { ErrorBoundary } from './components/ErrorBoundary'

// Public pages
import { LandingPage } from './pages/LandingPage'
import { PricingPage } from './pages/PricingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { OnboardingPage } from './pages/OnboardingPage'

// App pages
import { DashboardPage } from './pages/DashboardPage'
import { SchedulePage } from './pages/SchedulePage'
import { MonthPlannerPage } from './pages/MonthPlannerPage'
import { AvailabilityPage } from './pages/AvailabilityPage'
import { ClockPage } from './pages/ClockPage'
import { HoursPage } from './pages/HoursPage'
import { LeavePage } from './pages/LeavePage'
import { EmployeesPage } from './pages/EmployeesPage'
import { ProfilePage } from './pages/ProfilePage'
import { BillingPage } from './pages/BillingPage'
import { SettingsPage } from './pages/SettingsPage'
import { SickLeavePage } from './pages/SickLeavePage'
import { ShiftSwapPage } from './pages/ShiftSwapPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { LinkExpiredPage } from './pages/LinkExpiredPage'
import { AuthHashHandler } from './components/AuthHashHandler'

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
      <ToastProvider>
      <ConfirmProvider>
      <AuthProvider>
        <OrganizationProvider>
          <BrowserRouter>
            <AuthHashHandler />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/voorwaarden" element={<TermsPage />} />
              <Route path="/wachtwoord-vergeten" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/link-verlopen" element={<LinkExpiredPage />} />

              {/* Onboarding: requires auth, no org yet */}
              <Route element={<ProtectedRoute requireOrg={false} />}>
                <Route path="/onboarding" element={<OnboardingPage />} />
              </Route>

              {/* App routes: requires auth + org */}
              <Route element={<ProtectedRoute requireOrg={true} />}>
                <Route element={<AppLayout />}>
                  <Route path="/app/dashboard" element={<DashboardPage />} />
                  <Route path="/app/rooster" element={<SchedulePage />} />
                  <Route path="/app/maandplanner" element={<MonthPlannerPage />} />
                  <Route path="/app/beschikbaarheid" element={<AvailabilityPage />} />
                  <Route path="/app/klok" element={<ClockPage />} />
                  <Route path="/app/uren" element={<HoursPage />} />
                  <Route path="/app/verlof" element={<LeavePage />} />
                  <Route path="/app/medewerkers" element={<EmployeesPage />} />
                  <Route path="/app/profiel" element={<ProfilePage />} />
                  <Route path="/app/abonnement" element={<BillingPage />} />
                  <Route path="/app/instellingen" element={<SettingsPage />} />
                  <Route path="/app/ziek" element={<SickLeavePage />} />
                  <Route path="/app/ruilen" element={<ShiftSwapPage />} />
                </Route>
              </Route>

              {/* Legacy redirects */}
              <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="/rooster" element={<Navigate to="/app/rooster" replace />} />
              <Route path="/rooster-planner" element={<Navigate to="/app/maandplanner" replace />} />
              <Route path="/beschikbaarheid" element={<Navigate to="/app/beschikbaarheid" replace />} />
              <Route path="/klok" element={<Navigate to="/app/klok" replace />} />
              <Route path="/uren" element={<Navigate to="/app/uren" replace />} />
              <Route path="/verlof" element={<Navigate to="/app/verlof" replace />} />
              <Route path="/medewerkers" element={<Navigate to="/app/medewerkers" replace />} />
              <Route path="/profiel" element={<Navigate to="/app/profiel" replace />} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </OrganizationProvider>
      </AuthProvider>
      </ConfirmProvider>
      </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
