/**
 * Cloudflare Pages Function to proxy /api/* requests to the Azure backend.
 *
 * Routing is controlled by functions/_routes.json which includes "/api/*".
 * This function forwards all HTTP methods, headers, cookies, and request bodies
 * to the Azure App Service backend, and returns the response back to the browser.
 */

export async function onRequest(context) {
  try {
    const backendUrl = 'https://smartbook-api-bsfnbchccfbwgvdn.centralindia-01.azurewebsites.net';

    // Extract the full path from the request URL (e.g., /api/v1/auth/login)
    const url = new URL(context.request.url);
    const apiPath = url.pathname;
    const targetUrl = backendUrl + apiPath + url.search;

    // Build headers to forward, preserving cookies and CSRF tokens
    const headers = new Headers(context.request.headers);
    headers.delete('host');
    headers.set('host', new URL(targetUrl).host);
    headers.delete('content-length'); // Let fetch recalculate

    // Handle preflight OPTIONS requests early
    if (context.request.method === 'OPTIONS') {
      const corsHeaders = {
        'Access-Control-Allow-Origin': context.request.headers.get('origin') || '',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      };
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Build fetch options - only include body for methods that have one
    const fetchOptions = {
      method: context.request.method,
      headers,
    };

    if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
      try {
        fetchOptions.body = await context.request.arrayBuffer();
      } catch (e) {
        // If we can't read the body, proceed without it
        console.error('Failed to read request body:', e);
      }
    }

    // Forward the request to the Azure backend
    const response = await fetch(targetUrl, fetchOptions);

    // Clone the response and add CORS-safe headers
    const responseHeaders = new Headers(response.headers);
    const origin = context.request.headers.get('origin') || '';
    responseHeaders.set('Access-Control-Allow-Origin', origin);
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    responseHeaders.set('Access-Control-Expose-Headers', 'Set-Cookie, X-XSRF-TOKEN');

    // Return the response with the original body stream
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    const origin = context.request.headers.get('origin') || '';
    return new Response(
      JSON.stringify({ error: 'Proxy error', message: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }
}
