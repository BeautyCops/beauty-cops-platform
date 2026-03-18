# Railway frontend (beautycops.com)

## Recommended setup (same-origin API proxy)

The browser calls **`https://beautycops.com/api/...`**. Next.js proxies those requests to Django. This avoids:

- Wrong URLs when `NEXT_PUBLIC_API_BASE_URL` was set to `https://api.../api` (double `/api/api/...`)
- CORS / mixed-content issues
- Django **DisallowedHost** when the wrong `Host` header was forwarded

### Variables on the **frontend** Railway service

| Variable | Required | Example |
|----------|----------|---------|
| **`BACKEND_URL`** | **Yes** (for proxy) | `https://your-django-service.up.railway.app` or `https://api.beautycops.com` |
| `NEXT_PUBLIC_API_BASE_URL` | No | Leave unset, or set to `RELATIVE`, so the app uses `/api/...` on the same domain. |

**`BACKEND_URL` must be the Django base URL only** (no `/api` suffix).

### Optional: direct API (no proxy)

Set **`NEXT_PUBLIC_API_BASE_URL`** to the Django origin **without** a trailing `/api`, e.g. `https://api.beautycops.com`.  
Do **not** use `https://api.example.com/api`.

Local development: keep `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` in `.env.local`.
