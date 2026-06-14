import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
})

/** Per-seat price: €3 / medewerker / maand */
const PRICE_ID = Deno.env.get('STRIPE_PRICE_PER_SEAT') ?? Deno.env.get('STRIPE_PRICE_SHIFT') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Niet ingelogd')

    const { organizationId, returnUrl, portal, employeeCount = 1 } = await req.json()

    if (!organizationId) throw new Error('organizationId ontbreekt')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: callerProfile } = await supabaseAdmin
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (
      !callerProfile ||
      callerProfile.organization_id !== organizationId ||
      callerProfile.role !== 'admin'
    ) {
      return new Response(
        JSON.stringify({ error: 'Geen toegang tot dit abonnement.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('stripe_customer_id, name')
      .eq('id', organizationId)
      .single()

    let customerId = org?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org?.name ?? 'ShiftSync Klant',
        metadata: { organization_id: organizationId },
      })
      customerId = customer.id

      await supabaseAdmin
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organizationId)
    }

    if (portal) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      })
      return new Response(JSON.stringify({ url: portalSession.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!PRICE_ID) throw new Error('STRIPE_PRICE_PER_SEAT is niet geconfigureerd')

    const quantity = Math.max(1, Number(employeeCount) || 1)

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PRICE_ID, quantity }],
      success_url: `${returnUrl}?success=1`,
      cancel_url: `${returnUrl}?cancelled=1`,
      metadata: { organization_id: organizationId, plan: 'active' },
      subscription_data: {
        metadata: { organization_id: organizationId, plan: 'active' },
      },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Onbekende fout' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
