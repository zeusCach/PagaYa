import { notFound } from "next/navigation";
import { money } from "../../../lib/money";
import { getOrder } from "../../../lib/orders";
import RefreshStatus from "./refresh-status";

export const dynamic = "force-dynamic";

export default async function Payment({ params }: { params: Promise<{ id: string }> }) {
  const order = getOrder((await params).id);
  if (!order?.checkout_url) notFound();
  return <main className="payment">
    <div className="brand"><span className="brand-icon" aria-hidden="true">↗</span>PagaYa</div>
    <section className="card">
      <span className={`badge ${order.paid_at ? "paid" : "pending"}`}>{order.paid_at ? "Pagado" : "Pendiente"}</span>
      <h1>{order.description}</h1>
      <p className="metric">{money(order.cents)} <span>MXN</span></p>
      {order.mode === "demo" && <p>Demostración local. Puedes simular el pago sin usar una tarjeta.</p>}
      {!order.paid_at && (order.mode === "demo"
        ? <form action={`/api/demo/${order.id}`} method="post"><button className="primary">Simular pago</button></form>
        : <><p>La confirmación puede tardar unos segundos.</p><RefreshStatus /><a className="primary" href={order.checkout_url}>Abrir Stripe Checkout</a></>)}
    </section>
  </main>;
}
