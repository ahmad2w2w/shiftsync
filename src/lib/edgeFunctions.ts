import { supabase } from './supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Roept een Supabase Edge Function aan en geeft leesbare foutmeldingen terug. */
export async function invokeEdgeFunction<T extends Record<string, unknown>>(
  name: string,
  body: Record<string, unknown>
): Promise<T> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is niet geconfigureerd. Zet VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in Vercel → Environment Variables en redeploy.'
    )
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Je bent niet ingelogd. Log opnieuw in en probeer het opnieuw.')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  let payload: { error?: string; success?: boolean } = {}

  if (text) {
    try {
      payload = JSON.parse(text) as typeof payload
    } catch {
      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? `Edge function "${name}" niet gevonden. Deploy met: npx supabase functions deploy ${name}`
            : `Serverfout (${res.status}): ${text.slice(0, 300)}`
        )
      }
    }
  }

  if (!res.ok) {
    if (payload.error) throw new Error(payload.error)
    if (res.status === 404) {
      throw new Error(
        `Edge function "${name}" niet gevonden. Ga naar Supabase Dashboard → Edge Functions, of deploy via CLI.`
      )
    }
    if (res.status === 401) {
      throw new Error('Sessie verlopen. Log opnieuw in.')
    }
    throw new Error(`Serverfout (${res.status}). Check Supabase → Edge Functions → Logs.`)
  }

  if (payload.error) throw new Error(payload.error)
  return payload as T
}

/** @deprecated gebruik invokeEdgeFunction */
export async function parseEdgeFunctionError(
  error: unknown,
  data: unknown
): Promise<string> {
  if (data && typeof data === 'object' && 'error' in data) {
    const msg = (data as { error?: string }).error
    if (typeof msg === 'string' && msg.trim()) return msg
  }
  if (error instanceof Error) return error.message
  return 'Onbekende fout bij edge function'
}
