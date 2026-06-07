import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl =
  process.env.LARAVEL_API_BASE_URL ||
  process.env.NEXT_PUBLIC_LARAVEL_API_BASE_URL ||
  "https://tayibat-production.up.railway.app/api";

const authCookieName = "tayibat_auth";
const authCookieMaxAge = 60 * 60 * 24 * 30;

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const buildTargetUrl = (request: NextRequest, path: string[]) => {
  const target = new URL(`${apiBaseUrl.replace(/\/$/, "")}/${path.join("/")}`);
  target.search = request.nextUrl.search;
  return target;
};

const readRequestBody = async (request: NextRequest) => {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const body = await request.text();
  return body || undefined;
};

const isMutatingMethod = (method: string) => !["GET", "HEAD", "OPTIONS"].includes(method);

const passesOriginCheck = (request: NextRequest) => {
  if (!isMutatingMethod(request.method)) {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
};

const createProxyResponse = (text: string, response: Response) => {
  const contentType = response.headers.get("content-type") || "application/json";

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": contentType,
    },
  });
};

async function proxyLaravel(request: NextRequest, context: RouteContext) {
  if (!passesOriginCheck(request)) {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }

  const { path } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  const targetUrl = buildTargetUrl(request, path);
  const headers = new Headers({
    Accept: "application/json",
  });

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const laravelResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: await readRequestBody(request),
    cache: "no-store",
  });

  const responseText = await laravelResponse.text();
  const nextResponse = createProxyResponse(responseText, laravelResponse);
  const endpoint = path.join("/");

  if ((endpoint === "login" || endpoint === "register") && laravelResponse.ok) {
    try {
      const payload = JSON.parse(responseText);
      const issuedToken = payload?.token;

      if (issuedToken) {
        delete payload.token;

        const authResponse = NextResponse.json(payload, {
          status: laravelResponse.status,
        });

        authResponse.cookies.set(authCookieName, issuedToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: authCookieMaxAge,
        });

        return authResponse;
      }
    } catch {
      // Fall through and return the upstream response.
    }
  }

  if (endpoint === "logout") {
    nextResponse.cookies.delete(authCookieName);
  }

  return nextResponse;
}

export const GET = proxyLaravel;
export const POST = proxyLaravel;
export const PUT = proxyLaravel;
export const PATCH = proxyLaravel;
export const DELETE = proxyLaravel;
