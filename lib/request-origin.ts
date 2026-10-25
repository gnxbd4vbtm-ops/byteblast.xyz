export function getPublicOrigin() {
  if (process.env.NODE_ENV !== "production") {
    return `http://localhost:${process.env.PORT || "3000"}`;
  }

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configuredOrigin) {
    throw new Error("Missing required configuration: NEXT_PUBLIC_SITE_URL");
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(configuredOrigin);
  } catch {
    throw new Error("Invalid canonical origin configuration: NEXT_PUBLIC_SITE_URL");
  }

  if (
    parsedOrigin.protocol !== "https:" ||
    parsedOrigin.username ||
    parsedOrigin.password ||
    parsedOrigin.pathname !== "/" ||
    parsedOrigin.search ||
    parsedOrigin.hash
  ) {
    throw new Error("Invalid canonical origin configuration: NEXT_PUBLIC_SITE_URL");
  }

  return parsedOrigin.origin;
}
