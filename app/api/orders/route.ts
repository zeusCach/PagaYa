import { createOrder, listOrders, orderView, saveCheckout } from "../../../lib/orders";
import { stripeClient } from "../../../lib/stripe";
import { localHost, localOrigin } from "../../../lib/local-origin";

export async function GET(request: Request) {
  if (!localHost(request)) return new Response(null, { status: 403 });
  return Response.json(listOrders().map(orderView));
}

export async function POST(request: Request) {
  const origin = localOrigin(request);
  if (!origin) {
    return Response.json({ error: "Origen no permitido." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const id = body?.id;
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const cents = body?.cents;
  if (typeof id !== "string" || !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/.test(id)
    || !description || description.length > 120 || !Number.isInteger(cents) || cents < 1000 || cents > 99999999) {
    return Response.json({ error: "Ingresa un concepto y un importe entre $10.00 y $999,999.99 MXN." }, { status: 400 });
  }

  try {
    const stripe = stripeClient();
    const mode = stripe ? "stripe" : "demo";
    const order = createOrder(id, description, cents, mode);
    if (order.description !== description || order.cents !== cents || order.mode !== mode) {
      return Response.json({ error: "La referencia ya pertenece a otro cobro." }, { status: 409 });
    }
    if (order.checkout_url) return Response.json(orderView(order));

    const statusUrl = `${origin}/pagar/${id}`;
    const session = stripe && await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      client_reference_id: id,
      success_url: statusUrl,
      cancel_url: statusUrl,
      line_items: [{ quantity: 1, price_data: {
        currency: "mxn",
        unit_amount: cents,
        product_data: { name: description },
      } }],
    }, { idempotencyKey: id });
    if (session && !session.url) throw new Error("Checkout sin URL");
    // Demo links stay relative so they work on either local loopback hostname.
    return Response.json(orderView(saveCheckout(id, session?.url ?? `/pagar/${id}`, session?.id ?? null)), { status: 201 });
  } catch {
    return Response.json({ error: "No se pudo generar el enlace. Verifica la configuración e intenta de nuevo." }, { status: 503 });
  }
}
