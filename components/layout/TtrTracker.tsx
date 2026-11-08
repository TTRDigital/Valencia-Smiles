/*
 * TTR OS site tracker. Rendered only when NEXT_PUBLIC_TTR_SITE_KEY is set (the
 * site's key from TTR OS); without it nothing is added to the page. The key is
 * a public site identifier, not a secret.
 */
const KEY = process.env.NEXT_PUBLIC_TTR_SITE_KEY;

export function TtrTracker() {
  if (!KEY) return null;
  return <script src="https://ttr-portal.vercel.app/api/site/script" data-site={KEY} defer />;
}
