import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // TODO: verify Stripe webhook signature using STRIPE_WEBHOOK_SECRET
  // const body = await request.text();
  // const signature = request.headers.get('stripe-signature');
  // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);

  // TODO: handle relevant event types:
  // - payment_intent.succeeded
  // - payment_intent.payment_failed
  // - charge.refunded
  // - payout.paid

  return NextResponse.json({ received: true });
}
