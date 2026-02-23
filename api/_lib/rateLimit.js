// In-memory rate limiter for Vercel serverless functions.
// Note: stateless across instances — protects against single-instance burst abuse.
const store = new Map();

// Clean up old entries every ~100 calls to avoid unbounded growth
let callCount = 0;
function cleanup() {
  if (++callCount % 100 !== 0) return;
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetAt) store.delete(key);
  }
}

/**
 * Returns true if the IP has exceeded the limit.
 * @param {string} ip
 * @param {number} maxRequests
 * @param {number} windowMs
 */
export function isRateLimited(ip, maxRequests, windowMs) {
  cleanup();
  const now = Date.now();
  const record = store.get(ip) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count++;
  store.set(ip, record);

  return record.count > maxRequests;
}

export function getClientIp(req) {
  return (
    req.headers?.['x-forwarded-for']?.split(',')[0].trim() ||
    req.connection?.remoteAddress ||
    'unknown'
  );
}
