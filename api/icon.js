// Vercel serverless function: GET /api/icon?domain=github.com
// Fetches a website's icon from Google's favicon service and serves it from
// our own origin, so the app can read its pixels and adapt the icon tile.

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z0-9-]{2,63}$/i;

module.exports = async (req, res) => {
  const domain = String(req.query.domain || '').trim().toLowerCase();
  if (!DOMAIN_RE.test(domain)) {
    res.status(400).end();
    return;
  }

  try {
    const upstream = await fetch(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent('https://' + domain)}&sz=128`
    );
    if (!upstream.ok) {
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      res.status(404).end();
      return;
    }
    const body = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=604800');
    res.status(200).send(body);
  } catch {
    res.status(502).end();
  }
};
