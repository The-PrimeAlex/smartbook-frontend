// Cloudflare Pages Worker that proxies /api/* requests to the Azure backend.
// Deployed alongside _routes.json on Cloudflare Pages.
// Without this worker, /api/* requests in production fail because
// Cloudflare Pages has no backend server to handle them.

const BACKEND_URL = 'https://smartbook-api-bsfnbchccfbwgvdn.centralindia-01.azurewebsites.net';

export async function fetch(request) {
  const url = new URL(request.url);

  // Only proxy /api/* requests; let Cloudflare serve static files normally
  if (!url.pathname.startsWith('/api/')) {
    return fetch(request);
  }

  // Build the backend URL, preserving path and query string
  const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

  // Forward all headers from the original request
  const headers = new Headers(request.headers);
  // Remove Cloudflare-added headers that confuse the backend
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');
  // Set Host header so the backend knows the real target
  headers.set('Host', new URL(BACKEND_URL).host);
  // Forward the Cloudflare IP for rate limiting
  headers.set('X-Forwarded-For', request.headers.get('cf-connecting-ip') || '');

  // Create the proxied request
  const proxiedRequest = new Request(backendUrl, {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'follow',
  });

  // Send the request to the Azure backend
  let response;
  try {
    response = await fetch(proxiedRequest);
  } catch (error) {
    // If the backend is unreachable, return 502 with error details
    const errorHeaders = new Headers();
    errorHeaders.set('Content-Type', 'application/json');
    errorHeaders.set('Access-Control-Allow-Origin', url.origin);
    errorHeaders.set('Access-Control-Allow-Credentials', 'true');
    return new Response(
      JSON.stringify({ error: 'Backend unavailable', message: error.message }),
      { status: 502, headers: errorHeaders }
    );
  }

  // Build the response with CORS headers
  const responseHeaders = new Headers(response.headers);

  // Allow the Cloudflare Pages origin
  responseHeaders.set('Access-Control-Allow-Origin', url.origin);
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', '*');
  // Expose Set-Cookie so the browser stores CSRF and refresh cookies
  responseHeaders.set('Access-Control-Expose-Headers', 'Set-Cookie, X-XSRF-TOKEN');

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: responseHeaders,
    });
  }

  // Return the backend response with CORS headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}
