import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { verifyToken } from '@clerk/backend';

dotenv.config();

const app = express();
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10kb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const alertLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });
const clearLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const pingLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });

async function requireAuth(req, res, next) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    return next(); // Dev open mode
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    await verifyToken(authHeader.slice(7), { secretKey: secret });
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
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

async function sendSms(phone, message) {
  const key = process.env.TEXTBELT_KEY;
  if (!key) {
    console.warn('[Patrona] TEXTBELT_KEY not set — mock SMS to', phone);
    return;
  }
  const res = await fetch('https://textbelt.com/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message, key }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Textbelt send failed');
}

// In-memory location store (keyed by sessionId)
const locationStore = new Map();

function buildTrackingUrl(name, latitude, longitude, timestamp) {
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

  // Coords are optional — alert still sends without location
  if (latitude !== undefined && latitude !== null) {
    const coordsError = validateCoords(latitude, longitude);
    if (coordsError) return res.status(400).json({ success: false, error: coordsError });
  }

  if (triggerType && !VALID_TRIGGER_TYPES.has(triggerType)) {
    return res.status(400).json({ success: false, error: 'triggerType must be safeword, silence, or deviation' });
  }

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

    if (failed.length) {
      console.error('[Patrona] Some messages failed:', failed.map((f) => f.reason));
    }

    res.json({ success: true, messagesSent: sent, failed: failed.length });
  } catch (error) {
    console.error('[Patrona] SMS error:', error);
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
    `Patrona Update: ${userName.trim()} has confirmed they are safe. ` +
    `Alert cleared. No further action needed.`;

  try {
    await Promise.allSettled(
      contacts.map((contact) => sendSms(contact.phone, message))
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

// GET /api/location/:sessionId — Get latest location for a session (auth required)
app.get('/api/location/:sessionId', requireAuth, (req, res) => {
  const loc = locationStore.get(req.params.sessionId);
  if (!loc) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  res.json({ success: true, ...loc });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Clean JSON error handler (prevents stack traces leaking as HTML)
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Request too large' });
  }
  console.error('[Patrona] Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌙 Patrona server running on port ${PORT}`);
  console.log(`   SMS: ${process.env.TEXTBELT_KEY ? '✓ Textbelt configured' : '✗ TEXTBELT_KEY not set (mock mode)'}`);
});
