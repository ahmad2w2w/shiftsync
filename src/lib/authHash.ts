/** Parse Supabase auth errors/tokens from URL hash (#error=... or #access_token=...) */

export interface AuthHashError {
  error: string
  code?: string
  description: string
}

function hashParams(): URLSearchParams {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  return new URLSearchParams(hash)
}

export function getAuthHashError(): AuthHashError | null {
  const params = hashParams()
  const error = params.get('error')
  if (!error) return null
  return {
    error,
    code: params.get('error_code') ?? undefined,
    description: (
      params.get('error_description')?.replace(/\+/g, ' ') ??
      params.get('error') ??
      'Onbekende fout'
    ),
  }
}

export function hasAuthTokensInHash(): boolean {
  const params = hashParams()
  return params.has('access_token') || params.has('refresh_token')
}

export function getAuthTypeFromHash(): string | null {
  return hashParams().get('type')
}

export function clearAuthHash(): void {
  const path = window.location.pathname + window.location.search
  window.history.replaceState(null, '', path)
}

export function authHashErrorMessage(err: AuthHashError): string {
  if (err.code === 'otp_expired') {
    return 'Deze link is verlopen of al gebruikt. Supabase-links zijn meestal 1 uur geldig.'
  }
  if (err.error === 'access_denied') {
    return err.description || 'Toegang geweigerd. Vraag een nieuwe link aan.'
  }
  return err.description
}
