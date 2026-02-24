import { setCorsHeaders } from './_lib/cors.js';
import { isRateLimited, getClientIp } from './_lib/rateLimit.js';
import { isAuthorized } from './_lib/auth.js';
import { validateAlertBody } from './_lib/validate.js';
import { sendSms } from './_lib/sms.js';

function buildTrackingUrl(name, latitude, longitude, timestamp) {
  const base = process.env.FRONTEND_URL || 'https://patrona.vercel.app';
  const params = new URLSearchParams({
    tracking: '1',
    name,
    lat: latitude.toFixed(6),
    lng: longitude.toFixed(6),
    ts: timestamp || Date.now(),
  });
  return `${base}?${params.toString()}`;
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 10 * 1024) {
    return res.status(413).json({ success: false, error: 'Request too large' });
  }

  if (!await isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // 5 alerts per 15 minutes per IP
  if (isRateLimited(getClientIp(req), 5, 15 * 60 * 1000)) {
    return res.status(429).json({ success: false, error: 'Too many requests' });
  }

  const validationError = validateAlertBody(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  const { userName, contacts: rawContacts, latitude, longitude, triggerType } = req.body;

  const contacts = rawContacts.map(c => ({
    ...c,
    phone: c.phone.replace(/[\s\-\(\)]/g, ''),
  }));

  const hasLocation = typeof latitude === 'number' && typeof longitude === 'number';
  const trackingUrl = hasLocation ? buildTrackingUrl(userName, latitude, longitude, Date.now()) : null;
  const mapsLink = hasLocation ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;

  const triggerLabel =
    triggerType === 'safeword' ? 'safe word detected'
    : triggerType === 'silence' ? 'no response to check-ins'
    : 'route deviation detected';

  const message =
    `Patrona Alert: ${userName.trim()} may need help.\n` +
    `Reason: ${triggerLabel}.\n` +
    (hasLocation ? `Live location: ${mapsLink}\nTrack here: ${trackingUrl}\n` : `Location unavailable.\n`) +
    `Sent by Patrona safety system.`;

  try {
    const results = await Promise.allSettled(
      contacts.map((contact) => sendSms(contact.phone, message))
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected');

    const failedReasons = failed.map((f) => f.reason?.message || String(f.reason));
    if (failed.length) {
      console.error('[Patrona] Some messages failed:', failedReasons);
    }

    res.json({ success: true, messagesSent: sent, failed: failed.length, errors: failedReasons });
  } catch (error) {
    console.error('[Patrona] SMS error:', error);
    res.status(500).json({ success: false, error: 'Failed to send alert' });
  }
}
