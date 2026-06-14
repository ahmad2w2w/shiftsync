import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Niet geautoriseerd. Log opnieuw in.' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !serviceKey) {
      return json({ error: 'Server misconfiguratie (SUPABASE keys ontbreken).' }, 500)
    }

    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return json({ error: 'Ongeldige sessie. Log opnieuw in.' }, 401)
    }

    const { data: profile, error: profileError } = await supabaseUser
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin' || !profile.organization_id) {
      return json({ error: 'Alleen managers kunnen medewerkers uitnodigen.' }, 403)
    }

    let body: { email?: string; full_name?: string; hourly_rate?: number }
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Ongeldige request body.' }, 400)
    }

    const email = body.email?.trim().toLowerCase()
    const full_name = body.full_name?.trim()
    const hourly_rate = body.hourly_rate ?? 0

    if (!email || !full_name) {
      return json({ error: 'E-mail en naam zijn verplicht.' }, 400)
    }

    const siteUrl =
      Deno.env.get('PUBLIC_SITE_URL') ??
      req.headers.get('origin') ??
      'http://localhost:5173'
    const redirectTo = `${siteUrl.replace(/\/$/, '')}/reset-password`

    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: {
          full_name,
          role: 'employee',
          organization_id: profile.organization_id,
        },
      }
    )

    if (inviteError) {
      const msg = inviteError.message ?? String(inviteError)
      if (/already|registered|exists/i.test(msg)) {
        return json({
          error: 'Dit e-mailadres is al geregistreerd. Gebruik een ander adres of laat de medewerker inloggen.',
        }, 400)
      }
      if (/redirect|url/i.test(msg)) {
        return json({
          error: `Redirect URL niet toegestaan. Voeg toe in Supabase Auth → URL Configuration: ${redirectTo}`,
        }, 400)
      }
      return json({ error: msg }, 400)
    }

    const userId = inviteData.user?.id
    if (!userId) {
      return json({ error: 'Uitnodiging mislukt (geen gebruiker aangemaakt).' }, 500)
    }

    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          id: userId,
          email,
          full_name,
          role: 'employee',
          organization_id: profile.organization_id,
          hourly_rate,
        },
        { onConflict: 'id' }
      )

    if (upsertError) {
      console.error('users upsert failed:', upsertError)
      return json({
        error: `Account aangemaakt maar profiel opslaan mislukt: ${upsertError.message}`,
      }, 500)
    }

    return json({ success: true, email, redirectTo })
  } catch (err) {
    console.error('invite-employee error:', err)
    return json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
