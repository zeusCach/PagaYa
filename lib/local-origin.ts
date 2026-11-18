export function localHost(request: Request) {
  const host = request.headers.get("host") ?? "";
  return /^(127\.0\.0\.1|localhost):\d+$/.test(host) ? host : null;
}

export function localOrigin(request: Request) {
  const host = localHost(request);
  if (!host) return null;
  const origin = `http://${host}`;
  return request.headers.get("origin") === origin ? origin : null;
}
