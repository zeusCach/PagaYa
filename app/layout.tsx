import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "PagaYa · Cobros por enlace",
  description: "Crea y consulta tus cobros con tarjeta.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="es-MX"><body>{children}</body></html>;
}
