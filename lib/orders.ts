import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type Order = {
  id: string;
  description: string;
  cents: number;
  mode: "demo" | "stripe";
  created_at: string;
  paid_at: string | null;
  session_id: string | null;
  checkout_url: string | null;
};

const state = globalThis as typeof globalThis & { pagayaDb?: DatabaseSync };

function database() {
  if (state.pagayaDb) return state.pagayaDb;
  const directory = join(process.cwd(), ".data");
  mkdirSync(directory, { recursive: true });
  const db = new DatabaseSync(join(directory, "pagaya.sqlite"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      cents INTEGER NOT NULL CHECK (cents BETWEEN 1000 AND 99999999),
      mode TEXT NOT NULL CHECK (mode IN ('demo', 'stripe')),
      created_at TEXT NOT NULL,
      paid_at TEXT,
      session_id TEXT UNIQUE,
      checkout_url TEXT
    );
  `);
  state.pagayaDb = db;
  return db;
}

export function getOrder(id: string) {
  return database().prepare("SELECT * FROM orders WHERE id = ?").get(id) as Order | undefined;
}

export function listOrders() {
  return database().prepare(
    "SELECT * FROM orders WHERE checkout_url IS NOT NULL ORDER BY created_at DESC, rowid DESC",
  ).all() as Order[];
}

export function createOrder(id: string, description: string, cents: number, mode: Order["mode"]) {
  database().prepare(
    "INSERT INTO orders (id, description, cents, mode, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING",
  ).run(id, description, cents, mode, new Date().toISOString());
  return getOrder(id)!;
}

export function saveCheckout(id: string, url: string, sessionId: string | null) {
  database().prepare(
    "UPDATE orders SET checkout_url = ?, session_id = ? WHERE id = ? AND checkout_url IS NULL",
  ).run(url, sessionId, id);
  return getOrder(id)!;
}

export function markPaid(order: Order) {
  database().prepare(
    "UPDATE orders SET paid_at = ? WHERE id = ? AND paid_at IS NULL",
  ).run(new Date().toISOString(), order.id);
}

export function orderView({ id, description, cents, mode, created_at, paid_at, checkout_url }: Order) {
  return { id, description, cents, mode, created_at, paid_at, checkout_url };
}
