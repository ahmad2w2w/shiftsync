import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAuthHashError,
  hasAuthTokensInHash,
  getAuthTypeFromHash,
  clearAuthHash,
} from '../lib/authHash'

/** Redirect auth hash (#access_token / #error) from homepage to the right page. */
export function AuthHashHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const hashError = getAuthHashError()
    if (hashError) {
      clearAuthHash()
      navigate('/link-verlopen', { replace: true })
      return
    }

    if (!hasAuthTokensInHash()) return

    const type = getAuthTypeFromHash()
    const hash = window.location.hash
    const path = window.location.pathname

    // Recovery / invite / signup → wachtwoord instellen
    if (type === 'recovery' || type === 'invite' || type === 'signup' || type === 'magiclink') {
      if (path !== '/reset-password') {
        window.location.replace(`/reset-password${hash}`)
      }
      return
    }

    // Overige auth callback (bijv. magic link login)
    if (path === '/' || path === '/login') {
      window.location.replace(`/reset-password${hash}`)
    }
  }, [navigate])

  return null
}
