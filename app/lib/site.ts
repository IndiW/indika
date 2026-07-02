// Resolves to the Vercel-assigned production domain automatically; falls
// back to localhost in dev. Set NEXT_PUBLIC_SITE_URL to override with a
// custom domain.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
