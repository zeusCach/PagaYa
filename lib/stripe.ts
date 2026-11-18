import Stripe from "stripe";

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!key.startsWith("sk_test_") || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Configura una clave de prueba de Stripe y el secreto del webhook.");
  }
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 15000 });
}
