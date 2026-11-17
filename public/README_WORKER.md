# Cloudflare Pages Functions Proxy

This directory contains the Cloudflare Pages configuration for proxying `/api/*` requests to the Azure backend.

## Files

- **`_routes.json`** — Tells Cloudflare Pages to route all `/api/*` requests through Pages Functions instead of serving them as static files. This file is copied to the build output (`dist/cloudflare/`) during the Angular build.

- **`../functions/api/[[path]].js`** — The Pages Function that proxies requests to the Azure backend. It handles CORS headers, forwards cookies and auth headers, and returns the backend response to the browser.

## How it works

1. Browser loads `https://smartbookke.pages.dev` and makes API calls like `/api/v1/auth/login`
2. Cloudflare Pages reads `_routes.json` and routes `/api/*` to the Pages Function
3. The Pages Function (`[[path]].js`) forwards the request to the Azure backend
4. The backend response is returned with proper CORS headers so the browser accepts it

## Troubleshooting

If API calls return 404 on Cloudflare Pages:
- Ensure `_routes.json` exists in `public/` and is included in the build output
- Ensure `functions/api/[[path]].js` exists at the repo root
- Check Cloudflare Pages build logs for "No functions dir" warnings
