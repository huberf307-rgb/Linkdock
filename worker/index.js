// Cloudflare Worker for Linkdock. Static files are served straight from the
// assets; only /api/* runs through here (see run_worker_first in wrangler.jsonc).
//
// GET /api/icon?domain=github.com fetches a website's icon from Google's
// favicon service and serves it from our own origin, so the app can read its
// pixels and adapt the icon tile.

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z0-9-]{2,63}$/i;

async function handleIcon(request) {
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

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/icon') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
      }
      return handleIcon(request);
    }
    return env.ASSETS.fetch(request);
  },
};
