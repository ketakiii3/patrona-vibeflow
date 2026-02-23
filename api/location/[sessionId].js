import { supabase } from '../_lib/supabase.js';
import { setCorsHeaders } from '../_lib/cors.js';
import { isAuthorized } from '../_lib/auth.js';
import { isRateLimited, getClientIp } from '../_lib/rateLimit.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!await isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // 60 location reads per minute per IP
  if (isRateLimited(getClientIp(req), 60, 60 * 1000)) {
    return res.status(429).json({ success: false, error: 'Too many requests' });
  }

  const { sessionId } = req.query;

  if (!supabase) {
    return res.status(404).json({ success: false, error: 'Database not configured' });
  }

  try {
    const { data, error } = await supabase
      .from('location_pings')
      .select('latitude, longitude, timestamp')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({ success: true, ...data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch location' });
  }
}
