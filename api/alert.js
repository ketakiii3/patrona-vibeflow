import twilio from 'twilio';
import { setCorsHeaders } from './_lib/cors.js';
import { isRateLimited, getClientIp } from './_lib/rateLimit.js';
import { isAuthorized } from './_lib/auth.js';

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

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

  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // 5 alerts per 15 minutes per IP
  if (isRateLimited(getClientIp(req), 5, 15 * 60 * 1000)) {
    return res.status(429).json({ success: false, error: 'Too many requests' });
  }

  const { userName, contacts: rawContacts, latitude, longitude, triggerType } = req.body;

  if (!rawContacts?.length) {
    return res.status(400).json({ success: false, error: 'No contacts provided' });
  }

  // Strip spaces/dashes from phone numbers — Twilio needs clean format like +16513848787
  const contacts = rawContacts.map(c => ({
    ...c,
    phone: c.phone.replace(/[\s\-\(\)]/g, ''),
  }));

  const trackingUrl = buildTrackingUrl(userName, latitude, longitude, Date.now());
  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const triggerLabel =
    triggerType === 'safeword' ? 'safe word detected'
    : triggerType === 'silence' ? 'no response to check-ins'
    : triggerType === 'deviation' ? 'route deviation detected'
    : triggerType;

  const message =
    `🆘 Patrona Alert: ${userName} may need help.\n` +
    `Reason: ${triggerLabel}.\n` +
    `Live location: ${mapsLink}\n` +
    `Track here: ${trackingUrl}\n` +
    `Sent by Patrona safety system.`;

  if (!twilioClient) {
    console.warn('[Patrona] Twilio not configured — would have sent:', message);
    return res.json({ success: true, mock: true, messagesSent: contacts.length });
  }

  try {
    const results = await Promise.allSettled(
      contacts.map((contact) =>
        twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contact.phone,
        })
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected');

    if (failed.length) {
      console.error('[Patrona] Some messages failed:', failed.map((f) => f.reason));
    }

    res.json({ success: true, messagesSent: sent, failed: failed.length });
  } catch (error) {
    console.error('[Patrona] Twilio error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
