/** Haal leesbare fout uit Supabase Edge Function response (non-2xx). */
export async function parseEdgeFunctionError(
  error: unknown,
  data: unknown
): Promise<string> {
  if (data && typeof data === 'object' && 'error' in data) {
    const msg = (data as { error?: string }).error
    if (typeof msg === 'string' && msg.trim()) return msg
  }

  if (error && typeof error === 'object' && 'context' in error) {
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = (await ctx.json()) as { error?: string; message?: string }
        if (body?.error) return body.error
        if (body?.message) return body.message
      } catch {
        /* response body al gelezen of geen JSON */
      }
    }
  }

  if (error instanceof Error) {
    const msg = error.message
    if (msg.includes('non-2xx')) {
      return 'Edge function mislukt. Controleer of invite-employee is gedeployed en of je redirect-URL in Supabase Auth staat.'
    }
    return msg
  }

  return 'Onbekende fout bij edge function'
}
