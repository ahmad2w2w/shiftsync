import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@shiftsync.nl'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  type: 'shift_published' | 'leave_approved' | 'leave_rejected' | 'shift_assigned'
  recipientEmail: string
  recipientName: string
  data: Record<string, string>
}

function buildEmail(payload: NotificationPayload): { subject: string; html: string } {
  const { recipientName, data } = payload

  const baseStyle = `
    font-family: 'DM Sans', system-ui, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  `
  const header = `
    <div style="background: linear-gradient(135deg, #4f46e5, #334e68); padding: 32px; text-align: center;">
      <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 8px;">
          <span style="color: white; font-size: 18px;">⚡</span>
        </div>
        <span style="color: white; font-size: 20px; font-weight: 700;">ShiftSync</span>
      </div>
    </div>
  `
  const footer = `
    <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} ShiftSync · <a href="mailto:support@shiftsync.nl" style="color: #6366f1;">support@shiftsync.nl</a>
      </p>
    </div>
  `

  switch (payload.type) {
    case 'shift_published':
      return {
        subject: `Rooster gepubliceerd voor ${data.monthLabel}`,
        html: `<div style="${baseStyle}">${header}
          <div style="padding: 32px;">
            <h2 style="color: #0f172a; margin: 0 0 8px;">Hoi ${recipientName}!</h2>
            <p style="color: #64748b;">Je rooster voor <strong>${data.monthLabel}</strong> is gepubliceerd.</p>
            <div style="margin: 24px 0; padding: 16px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #6366f1;">
              <p style="margin: 0; color: #0f172a; font-weight: 600;">Log in om je diensten te bekijken.</p>
            </div>
            <a href="https://app.shiftsync.nl/app/rooster" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Rooster bekijken
            </a>
          </div>${footer}
        </div>`,
      }

    case 'leave_approved':
      return {
        subject: 'Je verlofaanvraag is goedgekeurd',
        html: `<div style="${baseStyle}">${header}
          <div style="padding: 32px;">
            <h2 style="color: #0f172a; margin: 0 0 8px;">Goed nieuws, ${recipientName}!</h2>
            <p style="color: #64748b;">Je verlofaanvraag is <strong style="color: #16a34a;">goedgekeurd</strong>.</p>
            <div style="margin: 24px 0; padding: 16px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a;">
              <p style="margin: 0 0 4px; color: #0f172a;"><strong>Periode:</strong> ${data.startDate} t/m ${data.endDate}</p>
              ${data.managerNote ? `<p style="margin: 4px 0 0; color: #64748b;"><em>${data.managerNote}</em></p>` : ''}
            </div>
          </div>${footer}
        </div>`,
      }

    case 'leave_rejected':
      return {
        subject: 'Update over je verlofaanvraag',
        html: `<div style="${baseStyle}">${header}
          <div style="padding: 32px;">
            <h2 style="color: #0f172a; margin: 0 0 8px;">Hoi ${recipientName},</h2>
            <p style="color: #64748b;">Je verlofaanvraag is helaas <strong style="color: #dc2626;">niet goedgekeurd</strong>.</p>
            <div style="margin: 24px 0; padding: 16px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
              <p style="margin: 0 0 4px; color: #0f172a;"><strong>Periode:</strong> ${data.startDate} t/m ${data.endDate}</p>
              ${data.managerNote ? `<p style="margin: 4px 0 0; color: #64748b;"><strong>Reden:</strong> ${data.managerNote}</p>` : ''}
            </div>
            <p style="color: #64748b; font-size: 14px;">Neem contact op met je manager als je vragen hebt.</p>
          </div>${footer}
        </div>`,
      }

    default:
      return {
        subject: 'Bericht van ShiftSync',
        html: `<div style="${baseStyle}">${header}
          <div style="padding: 32px;">
            <p>Hoi ${recipientName}, je hebt een nieuwe melding van ShiftSync.</p>
          </div>${footer}
        </div>`,
      }
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'RESEND_API_KEY niet geconfigureerd' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // ── Authorization ──────────────────────────────────────────
    // Caller must be an authenticated admin, and the recipient must
    // belong to the same organization as the caller.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Niet ingelogd' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Niet ingelogd' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload: NotificationPayload = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: caller } = await supabaseAdmin
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!caller || caller.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Alleen beheerders mogen meldingen versturen.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: recipient } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('email', payload.recipientEmail)
      .maybeSingle()

    if (!recipient || recipient.organization_id !== caller.organization_id) {
      return new Response(
        JSON.stringify({ error: 'Ontvanger hoort niet bij jouw organisatie.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { subject, html } = buildEmail(payload)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `ShiftSync <${FROM_EMAIL}>`,
        to: [payload.recipientEmail],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Resend API fout: ${err}`)
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Fout bij verzenden' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
