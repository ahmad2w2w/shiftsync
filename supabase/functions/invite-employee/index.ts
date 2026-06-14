import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

async function findAuthUserByEmail(
  admin: SupabaseClient,
  email: string
): Promise<{ id: string; email?: string } | null> {
  let page = 1
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const found = data.users.find((u) => u.email?.toLowerCase() === email)
    if (found) return found
    if (data.users.length < 200) break
    page++
  }
  return null
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
    const orgId = profile.organization_id

    async function linkUserToOrg(userId: string): Promise<string | null> {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name,
          role: 'employee',
          organization_id: orgId,
        },
      })

      const { error: upsertError } = await supabaseAdmin
        .from('users')
        .upsert(
          {
            id: userId,
            email,
            full_name,
            role: 'employee',
            organization_id: orgId,
            hourly_rate,
          },
          { onConflict: 'id' }
        )

      if (upsertError) return upsertError.message
      return null
    }

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: {
          full_name,
          role: 'employee',
          organization_id: orgId,
        },
      }
    )

    if (inviteError) {
      const msg = inviteError.message ?? String(inviteError)

      if (/already|registered|exists/i.test(msg)) {
        const existing = await findAuthUserByEmail(supabaseAdmin, email)
        if (!existing) {
          return json({
            error: 'Dit e-mailadres is al geregistreerd. Gebruik een ander adres.',
          }, 400)
        }

        if (existing.id === user.id) {
          return json({ error: 'Je kunt jezelf niet als medewerker uitnodigen.' }, 400)
        }

        const { data: existingProfile } = await supabaseAdmin
          .from('users')
          .select('organization_id')
          .eq('id', existing.id)
          .maybeSingle()

        if (existingProfile?.organization_id === orgId) {
          return json({ error: 'Deze medewerker zit al in je team.' }, 400)
        }

        if (
          existingProfile?.organization_id &&
          existingProfile.organization_id !== orgId
        ) {
          return json({
            error: 'Dit e-mailadres hoort al bij een ander bedrijf in ShiftSync.',
          }, 400)
        }

        const linkErr = await linkUserToOrg(existing.id)
        if (linkErr) {
          return json({ error: `Koppelen mislukt: ${linkErr}` }, 500)
        }

        return json({
          success: true,
          email,
          linked: true,
          message: `${full_name} is gekoppeld aan je team. Laat hen inloggen op /login, of "Wachtwoord vergeten" gebruiken als ze nog geen wachtwoord hebben.`,
        })
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

    const linkErr = await linkUserToOrg(userId)
    if (linkErr) {
      return json({ error: `Account aangemaakt maar koppelen mislukt: ${linkErr}` }, 500)
    }

    return json({
      success: true,
      email,
      message: `Uitnodiging verstuurd naar ${email}.`,
    })
  } catch (err) {
    console.error('invite-employee error:', err)
    return json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
