// Cloudflare Worker entry: serves /api/icon and hands everything else to the
// static assets. Reuses the Pages Function so the icon logic lives in one place.

import { onRequestGet as iconHandler } from '../functions/api/icon.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/icon') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
      }
      return iconHandler({ request, env });
    }
    return env.ASSETS.fetch(request);
  },
};
