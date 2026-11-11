/**
 * Cloudflare Pages Function to proxy /api/* requests to the Azure backend.
 *
 * This is the production equivalent of proxy.conf.json used in local development.
 * File: functions/api/[...catchall].ts
 * Matches: /api/v1/auth/login, /api/v1/rooms, /api/v1/auth/csrf, etc.
 */

export const onRequest: PagesFunction<Env> = async (context) => {
  const backendUrl = 'https://smartbook-api-bsfnbchccfbwgvdn.centralindia-01.azurewebsites.net';

  // Extract the full path from the request URL (e.g., /api/v1/auth/login)
  const url = new URL(context.request.url);
  const apiPath = url.pathname;

  // Forward query parameters
  const targetUrl = backendUrl + apiPath + url.search;

  // Build headers to forward, preserving cookies and CSRF tokens
  const headers = new Headers(context.request.headers);
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
};

interface Env {
  // Add any env vars here if needed in the future
}
