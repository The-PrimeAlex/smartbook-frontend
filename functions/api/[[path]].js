// Cloudflare Pages Function — proxies /api/* requests to the Azure backend.
// Uses [[path]] catch-all to match any path under /api/
const BACKEND = 'https://smartbook-api-bsfnbchccfbwgvdn.centralindia-01.azurewebsites.net';

export const onRequest = async ({ request, next, context }) => {
  const url = new URL(request.url);
  const backendUrl = BACKEND + url.pathname + url.search;

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': url.origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Build headers for the proxied request
  const headers = {};
  if (request.headers.get('Content-Type')) {
    headers['Content-Type'] = request.headers.get('Content-Type');
  }
  if (request.headers.get('Authorization')) {
    headers['Authorization'] = request.headers.get('Authorization');
  }
  if (request.headers.get('X-XSRF-TOKEN')) {
    headers['X-XSRF-TOKEN'] = request.headers.get('X-XSRF-TOKEN');
  }
  if (request.headers.get('Cookie')) {
    headers['Cookie'] = request.headers.get('Cookie');
  }
  headers['Host'] = new URL(BACKEND).host;
  headers['X-Forwarded-For'] = request.headers.get('cf-connecting-ip') || '';

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
      redirect: 'follow',
    });

    // Build response headers with CORS using Headers instance
    // to properly support multiple Set-Cookie headers
    const resHeaders = new Headers();
    resHeaders.set('Access-Control-Allow-Origin', url.origin);
    resHeaders.set('Access-Control-Allow-Credentials', 'true');
    resHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    resHeaders.set('Access-Control-Allow-Headers', '*');
    resHeaders.set('Access-Control-Expose-Headers', 'X-XSRF-TOKEN');
    resHeaders.set('Cache-Control', 'no-store');

    // Copy safe headers from backend response
    const contentType = response.headers.get('Content-Type');
    if (contentType) resHeaders.set('Content-Type', contentType);

    const contentLength = response.headers.get('Content-Length');
    if (contentLength) resHeaders.set('Content-Length', contentLength);

    // Use getSetCookie() to properly handle multiple Set-Cookie headers
    // get() returns a comma-joined string which corrupts cookie values
    const setCookies = response.headers.getSetCookie();
    if (setCookies && setCookies.length > 0) {
      for (const cookie of setCookies) {
        resHeaders.append('Set-Cookie', cookie);
        // Extract XSRF-TOKEN value and expose it via a custom header
        // because Set-Cookie is a restricted header not accessible to JavaScript
        const csrfMatch = cookie.match(/^XSRF-TOKEN=([^;]+)/);
        if (csrfMatch && csrfMatch[1]) {
          resHeaders.set('X-XSRF-TOKEN', csrfMatch[1]);
        }
      }
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    });
  } catch (err) {
    // Backend unreachable
    return new Response(
      JSON.stringify({ error: 'Backend unavailable', message: err.message }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': url.origin,
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }
};
