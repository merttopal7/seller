import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const pathStr = path.join("/");
    const url = new URL(req.url);
    const backendUrl = `${BACKEND_URL}/api/${pathStr}${url.search}`;

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    const headers = new Headers();
    // Copy incoming headers
    req.headers.forEach((value, key) => {
      // Do not copy target-specific host header directly to avoid conflicts
      if (key !== "host" && key !== "connection") {
        headers.set(key, value);
      }
    });

    // Securely inject authentication token from cookie to Bearer header
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    // Set Host correctly for target server
    headers.set("host", new URL(BACKEND_URL).host);

    let body: any = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("multipart/form-data")) {
        body = await req.arrayBuffer();
      } else {
        body = await req.text();
      }
    }

    const response = await fetch(backendUrl, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    // Forward cookies set by the backend (like logout cookie clearing or login session setting)
    const nextResponse = NextResponse.json(data || {}, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });

    // Set auth_token in Next.js response if returned by backend login/register
    if (data && data.token) {
      nextResponse.cookies.set("auth_token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    // Handle logout cookie clearing
    if (pathStr === "auth/logout") {
      nextResponse.cookies.set("auth_token", "", { maxAge: 0 });
    }

    return nextResponse;
  } catch (error) {
    console.error("API proxy error:", error);
    return NextResponse.json({ error: "Backend service unavailable" }, { status: 502 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
