import { NextRequest, NextResponse } from "next/server";
import { resolveBackendOriginForProxy } from "@/lib/apiBase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function proxy(req: NextRequest, segments: string[]) {
  const origin = resolveBackendOriginForProxy();
  if (!origin) {
    return NextResponse.json(
      {
        detail:
          "Frontend proxy misconfigured: set BACKEND_URL to your Django base URL (e.g. https://xxx.up.railway.app). | لم يُضبط BACKEND_URL في خدمة الواجهة.",
      },
      { status: 503 }
    );
  }

  const pathStr = segments.join("/");
  const target = pathStr
    ? `${origin}/api/${pathStr}${req.nextUrl.search}`
    : `${origin}/api/${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (HOP_BY_HOP.has(k)) return;
    // Do not forward browser Host — Django ALLOWED_HOSTS would reject beautycops.com on the API service.
    if (k === "host") return;
    headers.set(key, value);
  });

  let body: ArrayBuffer | undefined;
  if (!["GET", "HEAD"].includes(req.method)) {
    const buf = await req.arrayBuffer();
    if (buf.byteLength) body = buf;
  }

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: body,
    redirect: "manual",
  });

  const out = new Headers();
  const ct = res.headers.get("content-type");
  if (ct) out.set("content-type", ct);

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: out,
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function OPTIONS(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}
