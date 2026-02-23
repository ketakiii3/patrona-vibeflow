import { supabase } from './_lib/supabase.js';
import { setCorsHeaders } from './_lib/cors.js';
import { isRateLimited, getClientIp } from './_lib/rateLimit.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 120 pings per minute per IP (one every ~30s is normal, this allows bursts)
  if (isRateLimited(getClientIp(req), 120, 60 * 1000)) {
    return res.status(429).json({ success: false, error: 'Too many requests' });
  }

  const { sessionId, latitude, longitude, timestamp } = req.body;

  if (!sessionId) {
    return res.json({ success: true });
  }

  if (!supabase) {
    // Fallback: no database configured, just acknowledge
    console.warn('[Patrona] Supabase not configured — ping ignored');
    return res.json({ success: true });
  }

  try {
    // Upsert: update if session exists, insert if not
    const { error } = await supabase
      .from('location_pings')
      .upsert(
        {
          session_id: sessionId,
          latitude,
          longitude,
          timestamp: timestamp || Date.now(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      );

    if (error) {
      console.error('[Patrona] Ping store error:', error);
    }

    // Clean up old pings (older than 12 hours)
    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
    await supabase
      .from('location_pings')
      .delete()
      .lt('timestamp', twelveHoursAgo);

    res.json({ success: true });
  } catch (error) {
    console.error('[Patrona] Ping error:', error);
    res.json({ success: true }); // Don't fail on pings
  }
}
