// Cloudflare Pages Function: GET /api/icon?domain=github.com
// Same job as api/icon.js on Vercel — fetches a website's icon from Google's
// favicon service and serves it from our own origin, so the app can read its
// pixels and adapt the icon tile.

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z0-9-]{2,63}$/i;

export async function onRequestGet({ request }) {
  const domain = (new URL(request.url).searchParams.get('domain') || '').trim().toLowerCase();
  if (!DOMAIN_RE.test(domain)) return new Response(null, { status: 400 });

  try {
    const upstream = await fetch(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent('https://' + domain)}&sz=128`,
      { cf: { cacheEverything: true, cacheTtl: 2592000 } }
    );
    if (!upstream.ok) {
      return new Response(null, { status: 404, headers: { 'Cache-Control': 'public, max-age=86400' } });
    }
    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=604800',
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
