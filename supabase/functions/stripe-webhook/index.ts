import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
})

const PLAN_MAX_EMPLOYEES: Record<string, number> = {
  pro: 25,
  business: 999999,
  free: 5,
}

serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verificatie mislukt:', err)
    return new Response('Ongeldige handtekening', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'customer.subscription.updated'
  ) {
    const obj = event.data.object as Stripe.CheckoutSession | Stripe.Subscription
    const metadata = 'metadata' in obj ? obj.metadata : {}
    const organizationId = metadata?.organization_id
    const plan = metadata?.plan ?? 'free'

    if (organizationId) {
      await supabase
        .from('organizations')
        .update({
          plan,
          max_employees: PLAN_MAX_EMPLOYEES[plan] ?? 5,
          stripe_subscription_id: 'subscription' in obj ? (obj.subscription as string) : obj.id,
        })
        .eq('id', organizationId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const organizationId = subscription.metadata?.organization_id

    if (organizationId) {
      await supabase
        .from('organizations')
        .update({
          plan: 'free',
          max_employees: 5,
          stripe_subscription_id: null,
        })
        .eq('id', organizationId)
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
