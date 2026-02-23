import twilio from 'twilio';
import { setCorsHeaders } from './_lib/cors.js';
import { isRateLimited, getClientIp } from './_lib/rateLimit.js';

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 10 all-clears per 15 minutes per IP
  if (isRateLimited(getClientIp(req), 10, 15 * 60 * 1000)) {
    return res.status(429).json({ success: false, error: 'Too many requests' });
  }

  const { userName, contacts: rawContacts } = req.body;

  if (!rawContacts?.length) {
    return res.status(400).json({ success: false, error: 'No contacts provided' });
  }

  const contacts = rawContacts.map(c => ({
    ...c,
    phone: c.phone.replace(/[\s\-\(\)]/g, ''),
  }));

  const message =
    `✅ Patrona Update: ${userName} has confirmed they are safe. ` +
    `Alert cleared. No further action needed.`;

  if (!twilioClient) {
    console.warn('[Patrona] Twilio not configured — would have sent all-clear:', message);
    return res.json({ success: true, mock: true });
  }

  try {
    await Promise.allSettled(
      contacts.map((contact) =>
        twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contact.phone,
        })
      )
    );
    res.json({ success: true });
  } catch (error) {
    console.error('[Patrona] All-clear error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
