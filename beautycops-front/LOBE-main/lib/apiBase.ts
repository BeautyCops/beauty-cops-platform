/**
 * API base URL resolution for browser + server.
 *
 * Production issue: NEXT_PUBLIC_API_BASE_URL often set to `https://api.example.com/api`
 * while code appends `/api/v1/...` → broken double `/api/api/...`.
 *
 * Fix: strip trailing `/api`. Also supports same-origin proxy when NEXT_PUBLIC is unset
 * or set to RELATIVE (see app/api/[[...path]]/route.ts + BACKEND_URL).
 */

export function normalizeApiOrigin(url: string): string {
  let s = url.trim().replace(/\/+$/, "");
  while (/\/api$/i.test(s)) {
    s = s.replace(/\/api$/i, "").replace(/\/+$/, "");
  }
  return s;
}

/**
 * Base for client-side fetch. Empty = same-origin `/api/...` (proxied to Django).
 */
export function getClientApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw || /^RELATIVE$/i.test(raw) || /^SAME-ORIGIN$/i.test(raw)) {
    return "";
  }
  return normalizeApiOrigin(raw);
}

/** Full URL for an API path starting with /api/... */
export function apiUrl(apiPath: string): string {
  const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  const base = getClientApiBaseUrl();
  if (!base) return path;
  return `${base}${path}`;
}

/** Human-readable hint when fetch fails (network / CORS / wrong API URL). */
/** Server-only: Django origin for /api/* proxy (see app/api/[[...path]]/route.ts). */
export function resolveBackendOriginForProxy(): string {
  const list = [
    process.env.BACKEND_URL,
    process.env.API_BACKEND_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ];
  for (const v of list) {
    if (v?.trim()) return normalizeApiOrigin(v);
  }
  return "";
}

export function describeFetchFailure(err: unknown): string {
  if (err instanceof TypeError && /fetch|network|failed/i.test(String(err.message))) {
    const usingProxy = !getClientApiBaseUrl();
    if (usingProxy) {
      return "تعذر الاتصال بالخادم. تأكد من ضبط متغير BACKEND_URL في خدمة الواجهة على Railway وأن الخادم الخلفي يعمل.";
    }
    return "تعذر الاتصال بالخادم. تحقق من عنوان API (NEXT_PUBLIC_API_BASE_URL) وأن الخادم الخلفي متاح.";
  }
  return "حدث خطأ غير متوقع. الرجاء المحاولة لاحقًا.";
}
