import { verifyToken } from '@clerk/backend';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

/**
 * Returns true if the request carries a valid Clerk JWT.
 * Falls back to open mode in dev when CLERK_SECRET_KEY is not set.
 */
export async function isAuthorized(req) {
  if (!CLERK_SECRET_KEY) {
    if (process.env.NODE_ENV === 'production') return false; // Never open in production
    return true; // Dev open mode
  }
  const authHeader = req.headers?.['authorization'];
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  try {
    await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
    return true;
  } catch {
    return false;
  }
}
