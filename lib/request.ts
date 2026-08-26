export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const expected = new URL(request.url);
  try { return new URL(origin).host === expected.host; } catch { return false; }
}
