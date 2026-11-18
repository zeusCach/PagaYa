"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Order } from "../lib/orders";
import { money } from "../lib/money";

type OrderView = Omit<Order, "session_id">;
const date = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Cancun" });

export default function Dashboard({ stripe }: { stripe: boolean }) {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [latest, setLatest] = useState<OrderView>();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState("Cargando historial…");
  const [busy, setBusy] = useState(false);
  const attempt = useRef<{ id: string; description: string; cents: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/orders", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error();
        setOrders(await response.json());
        setHistory("");
      } catch {
        if (!controller.signal.aborted) setHistory("No se pudo cargar el historial. Volveremos a intentarlo.");
      }
    }
    void refresh();
    const timer = setInterval(refresh, 4000);
    return () => { controller.abort(); clearInterval(timer); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const description = String(data.get("description")).trim();
    const amount = String(data.get("amount")).trim().replace(",", ".");
    setError("");
    setStatus("");
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(amount) || !description) {
      setError("Escribe un concepto y un importe válido con hasta dos decimales.");
      return;
    }
    const [whole, fraction = ""] = amount.split(".");
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
    const previous = attempt.current;
    const id = previous?.description === description && previous.cents === cents ? previous.id : crypto.randomUUID();
    attempt.current = { id, description, cents };
    setBusy(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attempt.current),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setLatest(result);
      setOrders((items) => [result, ...items.filter((item) => item.id !== result.id)]);
      attempt.current = null;
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el cobro.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(order: OrderView) {
    if (!order.checkout_url) return;
    try {
      await navigator.clipboard.writeText(new URL(order.checkout_url, location.origin).href);
      setStatus("Enlace copiado.");
    } catch {
      setStatus("Abre el enlace y cópialo desde la barra de direcciones.");
    }
  }

  const paid = orders.filter((order) => order.paid_at);
  const total = paid.reduce((sum, order) => sum + order.cents, 0);
  const current = orders.find((order) => order.id === latest?.id) ?? latest;

  return <>
    <header className="bar"><div className="bar-inner">
      <a className="brand" href="/"><span className="brand-icon" aria-hidden="true">↗</span>PagaYa</a>
      <span className="badge environment">{stripe ? "Stripe · Pruebas" : "Demo local"}</span>
    </div></header>
    <main className="dashboard">
      <section className="intro">
        <h1>Cobros</h1>
        <p>Crea un enlace de pago y consulta cuándo lo pagan.</p>
      </section>
      <div className="grid">
        <section className="card create">
          <h2>Nuevo cobro</h2>
          <form onSubmit={submit}>
            <label htmlFor="description">Concepto</label>
            <input id="description" name="description" placeholder="Ej. Anticipo de pedido" required maxLength={120} disabled={busy} />
            <label htmlFor="amount">Importe</label>
            <div className="amount"><span aria-hidden="true">$</span><input id="amount" name="amount" inputMode="decimal" placeholder="0.00" required disabled={busy} /><span>MXN</span></div>
            <small>Mínimo $10.00 MXN</small>
            <button className="primary" type="submit" disabled={busy}>{busy ? "Generando…" : "Generar enlace"}</button>
            {error && <p className="error" role="alert">{error}</p>}
          </form>
          {current?.checkout_url && <div className="result">
            <strong>Enlace generado</strong>
            <div className="actions">
              <a href={current.checkout_url} target="_blank" rel="noreferrer">Abrir enlace ↗</a>
              <button type="button" onClick={() => copy(current)}>Copiar enlace</button>
            </div>
          </div>}
        </section>
        <section className="card overview">
          <h2>Resumen</h2>
          <p className="metric-label">Total pagado en pruebas</p>
          <p className="metric">{money(total)} <span>MXN</span></p>
          <dl>
            <div><dt>Pagados</dt><dd>{paid.length}</dd></div>
            <div><dt>Pendientes</dt><dd>{orders.length - paid.length}</dd></div>
          </dl>
        </section>
      </div>
      <section className="card history">
        <div className="history-heading"><h2>Historial de cobros</h2><span>{orders.length} {orders.length === 1 ? "cobro" : "cobros"}</span></div>
        <p className="notice" role="status">{status || history}</p>
        {!history && orders.length === 0 && <p className="empty">Tu primer cobro aparecerá aquí.</p>}
        <ul>{orders.map((order) => <li key={order.id}>
          <div className="order-name"><strong>{order.description}</strong><small>{date.format(new Date(order.created_at))} · {order.mode === "demo" ? "Demo" : "Stripe"}</small></div>
          <strong>{money(order.cents)}</strong>
          <span className={`badge ${order.paid_at ? "paid" : "pending"}`}>{order.paid_at ? "Pagado" : "Pendiente"}</span>
          <a className="detail" href={`/pagar/${order.id}`} target="_blank" rel="noreferrer">Ver cobro ↗</a>
          {!order.paid_at && <button className="copy" type="button" onClick={() => copy(order)}>Copiar enlace</button>}
        </li>)}</ul>
      </section>
    </main>
  </>;
}
