import { getOrder, markPaid } from "../../../../lib/orders";
import { localOrigin } from "../../../../lib/local-origin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = localOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  const order = getOrder((await params).id);
  if (order?.mode !== "demo" || !order.checkout_url) return new Response(null, { status: 404 });
  markPaid(order);
  return Response.redirect(new URL(`/pagar/${order.id}`, origin), 303);
}
