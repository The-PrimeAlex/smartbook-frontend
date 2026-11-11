/**
 * Cloudflare Pages Function to proxy /api/* requests to the Azure backend.
 *
 * This is the production equivalent of proxy.conf.json used in local development.
 * It forwards all HTTP methods, headers, cookies, and request bodies to the
 * Azure App Service backend, and returns the response back to the browser.
 */

export async function onRequest(context) {
  // The Azure backend URL — matches proxy.conf.json target
  const backendUrl = 'https://smartbook-api-bsfnbchccfbwgvdn.centralindia-01.azurewebsites.net';

  // Reconstruct the full path after /api (e.g. /api/v1/auth/login → /api/v1/auth/login)
  // context.params.catchall is an array of path segments: ["v1", "auth", "login"]
  const catchall = context.params.catchall || [];
  const apiPath = '/' + (Array.isArray(catchall) ? catchall.join('/') : catchall);

  const targetUrl = backendUrl + apiPath;

  // Build headers to forward, preserving cookies and CSRF tokens
  const headers = new Headers(context.request.headers);

  // Remove Cloudflare-specific headers that might interfere
  headers.delete('host');
  headers.set('host', new URL(targetUrl).host);

  // Forward the request to the Azure backend
  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers,
    body: ['GET', 'HEAD'].includes(context.request.method)
      ? undefined
      : await context.request.blob(),
  });

  // Clone the response and add CORS-safe headers
  const responseHeaders = new Headers(response.headers);

  // Ensure cookies are visible to the browser (for CSRF and refresh tokens)
  responseHeaders.set('Access-Control-Allow-Origin', context.request.headers.get('origin') || '');
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', '*');
  responseHeaders.set('Access-Control-Expose-Headers', 'Set-Cookie, X-XSRF-TOKEN');

  // Handle preflight OPTIONS requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: responseHeaders,
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}
