import express from 'express';
import twilio from 'twilio';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const alertLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });
const clearLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const pingLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });

function requireAuth(req, res, next) {
  const secret = process.env.PATRONA_API_SECRET;
  if (!secret) return next(); // Not configured — open in dev
  const key = req.headers['x-api-key'] || req.query?.api_key;
  if (key !== secret) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
}

const VALID_TRIGGER_TYPES = new Set(['safeword', 'silence', 'deviation']);
const E164_RE = /^\+?[1-9]\d{6,14}$/;

function validateContacts(contacts) {
  if (!Array.isArray(contacts) || contacts.length === 0) return 'contacts must be a non-empty array';
  if (contacts.length > 10) return 'Too many contacts (max 10)';
  for (const c of contacts) {
    const phone = c?.phone?.replace(/[\s\-\(\)]/g, '');
    if (!phone || !E164_RE.test(phone)) return `Invalid phone number: ${c?.phone}`;
  }
  return null;
}

function validateCoords(latitude, longitude) {
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90)
    return 'latitude must be a number between -90 and 90';
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180)
    return 'longitude must be a number between -180 and 180';
  return null;
}

// In-memory location store (keyed by sessionId)
// For production, use a database
const locationStore = new Map();

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

function buildTrackingUrl(name, latitude, longitude, timestamp) {
  // Use the frontend URL (set FRONTEND_URL in .env) or fall back to localhost
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  const params = new URLSearchParams({
    tracking: '1',
    name,
    lat: latitude.toFixed(6),
    lng: longitude.toFixed(6),
    ts: timestamp || Date.now(),
  });
  return `${base}?${params.toString()}`;
}

// POST /api/alert — Send emergency SMS to all contacts
app.post('/api/alert', requireAuth, alertLimiter, async (req, res) => {
  const { userName, contacts: rawContacts, latitude, longitude, triggerType } = req.body;

  if (!userName || typeof userName !== 'string' || !userName.trim()) {
    return res.status(400).json({ success: false, error: 'userName is required' });
  }
  if (userName.length > 100) return res.status(400).json({ success: false, error: 'userName too long' });

  const contactsError = validateContacts(rawContacts);
  if (contactsError) return res.status(400).json({ success: false, error: contactsError });

  const coordsError = validateCoords(latitude, longitude);
  if (coordsError) return res.status(400).json({ success: false, error: coordsError });

  if (triggerType && !VALID_TRIGGER_TYPES.has(triggerType)) {
    return res.status(400).json({ success: false, error: 'triggerType must be safeword, silence, or deviation' });
  }

  const contacts = rawContacts.map(c => ({
    ...c,
    phone: c.phone.replace(/[\s\-\(\)]/g, ''),
  }));

  const trackingUrl = buildTrackingUrl(userName, latitude, longitude, Date.now());
  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const triggerLabel =
    triggerType === 'safeword' ? 'safe word detected'
    : triggerType === 'silence' ? 'no response to check-ins'
    : 'route deviation detected';

  const message =
    `🆘 Patrona Alert: ${userName.trim()} may need help.\n` +
    `Reason: ${triggerLabel}.\n` +
    `Live location: ${mapsLink}\n` +
    `Track here: ${trackingUrl}\n` +
    `Sent by Patrona safety system.`;

  if (!twilioClient) {
    console.warn('[Patrona] Twilio not configured — would have sent:');
    console.warn(message);
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
    res.status(500).json({ success: false, error: 'Failed to send alert' });
  }
});

// POST /api/alert/clear — Send all-clear SMS
app.post('/api/alert/clear', requireAuth, clearLimiter, async (req, res) => {
  const { userName, contacts: rawContacts } = req.body;

  if (!userName || typeof userName !== 'string' || !userName.trim()) {
    return res.status(400).json({ success: false, error: 'userName is required' });
  }
  if (userName.length > 100) return res.status(400).json({ success: false, error: 'userName too long' });

  const contactsError = validateContacts(rawContacts);
  if (contactsError) return res.status(400).json({ success: false, error: contactsError });

  const contacts = rawContacts.map(c => ({
    ...c,
    phone: c.phone.replace(/[\s\-\(\)]/g, ''),
  }));

  const message =
    `✅ Patrona Update: ${userName.trim()} has confirmed they are safe. ` +
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
    res.status(500).json({ success: false, error: 'Failed to send all-clear' });
  }
});

// POST /api/ping — Store latest location for a session
app.post('/api/ping', requireAuth, pingLimiter, (req, res) => {
  const { sessionId, latitude, longitude, timestamp } = req.body;
  if (sessionId) {
    const coordsError = validateCoords(latitude, longitude);
    if (coordsError) return res.status(400).json({ success: false, error: coordsError });

    locationStore.set(sessionId, { latitude, longitude, timestamp: timestamp || Date.now() });
    // Clean up old sessions (older than 12h)
    for (const [id, loc] of locationStore.entries()) {
      if (Date.now() - loc.timestamp > 12 * 60 * 60 * 1000) {
        locationStore.delete(id);
      }
    }
  }
  res.json({ success: true });
});

// GET /api/location/:sessionId — Get latest location for a session
app.get('/api/location/:sessionId', (req, res) => {
  const loc = locationStore.get(req.params.sessionId);
  if (!loc) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  res.json({ success: true, ...loc });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    twilio: !!twilioClient,
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌙 Patrona server running on port ${PORT}`);
  console.log(`   Twilio: ${twilioClient ? '✓ configured' : '✗ not configured (mock mode)'}`);
});
