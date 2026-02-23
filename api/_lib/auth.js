const API_SECRET = process.env.PATRONA_API_SECRET;

/**
 * Returns true if the request carries a valid API secret.
 * Accepts it via X-Api-Key header or api_key query param.
 */
export function isAuthorized(req) {
  if (!API_SECRET) return true; // Secret not configured — open in dev
  const header = req.headers?.['x-api-key'];
  const query = req.query?.api_key;
  return header === API_SECRET || query === API_SECRET;
}
