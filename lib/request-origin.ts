export function getPublicOrigin(request: Request) {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
  const host = forwardedHost || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || requestUrl.protocol.slice(0, -1);

  return host ? `${protocol}://${host}` : requestUrl.origin;
}
