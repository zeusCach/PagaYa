const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function money(cents: number) {
  return pesos.format(cents / 100);
}
