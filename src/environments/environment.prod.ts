// Production environment - calls Azure backend directly to avoid Cloudflare Pages proxy issues
export const environment = {
  production: true,
  apiUrl: 'https://smartbook-api-bsfnbchccfbwgvdn.centralindia-01.azurewebsites.net/api/v1',
};
