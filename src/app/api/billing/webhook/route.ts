import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Webhook handler for Stripe billing events
// Funds generated support ChaseWhiteRabbit NGO mission
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature');

  // Verify the webhook signature for security
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing Stripe signature or webhook secret');
    return NextResponse.json(
      { error: 'Missing stripe signature or webhook secret' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify the webhook signature and parse the event
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  try {

    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function handleSubscriptionCreated(subscription: any) {
  console.log('New subscription created:', subscription.id);
  
  // Update user's subscription status
  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: subscription.metadata?.user_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      plan_id: subscription.items.data[0]?.price?.id,
      created_at: new Date(),
      updated_at: new Date(),
    });

  if (error) {
    console.error('Error updating subscription:', error);
  }

  // Log revenue for NGO tracking
  await logRevenueForNGO(subscription);
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('Subscription updated:', subscription.id);
  
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      plan_id: subscription.items.data[0]?.price?.id,
      updated_at: new Date(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('Subscription cancelled:', subscription.id);
  
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date(),
      updated_at: new Date(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error cancelling subscription:', error);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  console.log('Payment succeeded for invoice:', invoice.id);
  
  // Log successful payment for NGO revenue tracking
  await supabase
    .from('ngo_revenue_log')
    .insert({
      invoice_id: invoice.id,
      subscription_id: invoice.subscription,
      customer_id: invoice.customer,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      payment_date: new Date(invoice.created * 1000),
      description: `AI Remix Platform subscription payment - supporting ChaseWhiteRabbit NGO`,
      created_at: new Date(),
    });

  // Update subscription payment status
  await supabase
    .from('user_subscriptions')
    .update({
      last_payment_date: new Date(invoice.created * 1000),
      last_payment_amount: invoice.amount_paid,
      updated_at: new Date(),
    })
    .eq('stripe_subscription_id', invoice.subscription);
}

async function handlePaymentFailed(invoice: any) {
  console.log('Payment failed for invoice:', invoice.id);
  
  // Notify user of failed payment
  await supabase
    .from('user_notifications')
    .insert({
      user_id: invoice.metadata?.user_id,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: 'Your subscription payment failed. Please update your payment method.',
      created_at: new Date(),
    });

  // Log failed payment attempt
  await supabase
    .from('payment_failures')
    .insert({
      invoice_id: invoice.id,
      subscription_id: invoice.subscription,
      customer_id: invoice.customer,
      amount: invoice.amount_due,
      currency: invoice.currency,
      failure_reason: invoice.last_finalization_error?.message || 'Unknown',
      created_at: new Date(),
    });
}

async function logRevenueForNGO(subscription: any) {
  // Calculate revenue allocation for ChaseWhiteRabbit NGO
  const monthlyAmount = subscription.items.data[0]?.price?.unit_amount || 0;
  const ngoAllocation = Math.floor(monthlyAmount * 0.3); // 30% to NGO
  const operationalCosts = Math.floor(monthlyAmount * 0.7); // 70% operational
  
  await supabase
    .from('ngo_revenue_allocation')
    .insert({
      subscription_id: subscription.id,
      total_amount: monthlyAmount,
      ngo_allocation: ngoAllocation,
      operational_allocation: operationalCosts,
      allocation_percentage: 30,
      beneficiary_org: 'ChaseWhiteRabbit',
      purpose: 'AI tools for social impact organizations',
      created_at: new Date(),
    });
}