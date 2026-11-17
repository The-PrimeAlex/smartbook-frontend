// Cloudflare Pages Worker that proxies /api/* requests to the Azure backend.
// Uses a minimal approach to avoid Cloudflare Worker runtime crashes (Error 1019).
const BACKEND = 'https://smartbook-api-bsfnbchccfbwgvdn.centralindia-01.azurewebsites.net';

export async function fetch(request) {
  const url = new URL(request.url);

  // Only proxy /api/* requests; let Cloudflare serve static files normally
  if (!url.pathname.startsWith('/api/')) {
    return await fetch(request);
  }

  // Build the backend URL
  const backendUrl = BACKEND + url.pathname + url.search;

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(url.origin),
    });
  }

  // Build headers for the proxied request — manually copy only the ones we need
  const proxiedHeaders = new Headers();
  proxiedHeaders.set('Content-Type', request.headers.get('Content-Type') || 'application/json');
  proxiedHeaders.set('Authorization', request.headers.get('Authorization') || '');
  proxiedHeaders.set('X-XSRF-TOKEN', request.headers.get('X-XSRF-TOKEN') || '');
  proxiedHeaders.set('Cookie', request.headers.get('Cookie') || '');
  proxiedHeaders.set('Accept', request.headers.get('Accept') || '*/*');
  proxiedHeaders.set('Host', new URL(BACKEND).host);
  proxiedHeaders.set('X-Forwarded-For', request.headers.get('cf-connecting-ip') || '');

  // Forward the request body for POST/PUT/PATCH/DELETE
  let body = undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = request.body;
  }

  // Send to Azure backend
  let response;
  try {
    response = await fetch(backendUrl, {
      method: request.method,
      headers: proxiedHeaders,
      body: body,
      redirect: 'follow',
    });
  } catch (err) {
    // Backend unreachable — return 502
    const errHeaders = corsHeaders(url.origin);
    errHeaders['Content-Type'] = 'application/json';
    return new Response(
      JSON.stringify({ error: 'Backend unavailable', message: err.message }),
      { status: 502, headers: errHeaders }
    );
  }

  // Build response headers with CORS
  const respHeaders = new Headers();
  // Copy Set-Cookie headers from backend response
  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() === 'set-cookie') {
      respHeaders.append('Set-Cookie', value);
    } else {
      respHeaders.set(key, value);
    }
  }
  // Add CORS headers
  Object.entries(corsHeaders(url.origin)).forEach(([k, v]) => respHeaders.set(k, v));
  respHeaders.set('Cache-Control', 'no-store');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: respHeaders,
  });
}

// CORS headers helper
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': 'Set-Cookie, X-XSRF-TOKEN',
    'Access-Control-Max-Age': '86400',
  };
}
