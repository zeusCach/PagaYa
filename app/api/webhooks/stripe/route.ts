import type Stripe from "stripe";
import { getOrder, markPaid } from "../../../../lib/orders";
import { stripeClient } from "../../../../lib/stripe";

export async function POST(request: Request) {
  const stripe = stripeClient();
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !signature) return new Response(null, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (event.livemode || event.type !== "checkout.session.completed") return new Response(null, { status: 204 });
  const session = event.data.object;
  if (session.payment_status !== "paid" || session.mode !== "payment" || !session.client_reference_id) {
    return new Response(null, { status: 204 });
  }
  const order = getOrder(session.client_reference_id);
  if (order?.mode !== "stripe") return new Response(null, { status: 204 });
  if (!order.session_id) return new Response(null, { status: 503 });
  if (session.id !== order.session_id || session.currency !== "mxn" || session.amount_total !== order.cents) {
    return new Response(null, { status: 400 });
  }
  markPaid(order);
  return new Response(null, { status: 204 });
}
