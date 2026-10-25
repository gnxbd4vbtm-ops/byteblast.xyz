import { NextResponse, type NextRequest } from "next/server";

const markdownPaths = new Set(["/", "/about", "/contact", "/privacy", "/status", "/terms"]);

function acceptsMarkdown(accept: string | null) {
  return accept?.split(",").some((mediaRange) => {
    const [mediaType, ...parameters] = mediaRange.split(";");
    if (mediaType.trim().toLowerCase() !== "text/markdown") {
      return false;
    }

    const qualityParameter = parameters.find((parameter) => /^\s*q\s*=/i.test(parameter));
    if (!qualityParameter) {
      return true;
    }

    const quality = Number(qualityParameter.split("=")[1]);
    return Number.isFinite(quality) && quality > 0 && quality <= 1;
  }) ?? false;
}

function addVaryAccept(response: NextResponse) {
  const vary = response.headers.get("Vary");
  if (!vary || !vary.split(",").some((value) => value.trim().toLowerCase() === "accept")) {
    response.headers.set("Vary", vary ? `${vary}, Accept` : "Accept");
  }
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDevelopment = process.env.NODE_ENV === "development";
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";
  if (
    (request.method === "GET" || request.method === "HEAD") &&
    markdownPaths.has(pathname) &&
    acceptsMarkdown(request.headers.get("accept"))
  ) {
    const markdownUrl = request.nextUrl.clone();
    markdownUrl.pathname = "/markdown-content";
    markdownUrl.searchParams.set("__markdown_path", pathname);

    const response = NextResponse.rewrite(markdownUrl, {
      request: { headers: requestHeaders },
    });
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    addVaryAccept(response);
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  addVaryAccept(response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};