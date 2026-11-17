// Cloudflare Pages Worker — proxies /api/* to Azure backend.
// Minimal implementation to avoid Error 1019 runtime crashes.
const BACKEND =
  'https://smartbook-api-bsfnbchccfbwgvdn.centralindia-01.azurewebsites.net';

export async function fetch(request) {
  const url = new URL(request.url);

  // Only proxy /api/* requests
  if (!url.pathname.startsWith('/api/')) {
    return await fetch(request);
  }

  const backendUrl = BACKEND + url.pathname + url.search;

  // Handle preflight OPTIONS
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

  // Build proxied headers — only the ones the backend needs
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

    // Build response with CORS — use plain object for headers to avoid Headers iteration crash
    const resHeaders = {
      'Access-Control-Allow-Origin': url.origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': 'Set-Cookie, X-XSRF-TOKEN',
      'Cache-Control': 'no-store',
    };

    // Copy only safe headers from backend response — avoid iterating all headers
    const contentType = response.headers.get('Content-Type');
    if (contentType) resHeaders['Content-Type'] = contentType;

    const contentLength = response.headers.get('Content-Length');
    if (contentLength) resHeaders['Content-Length'] = contentLength;

    // Copy Set-Cookie headers individually
    const setCookie = response.headers.get('Set-Cookie');
    if (setCookie) resHeaders['Set-Cookie'] = setCookie;

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
      },
    );
  }
}
