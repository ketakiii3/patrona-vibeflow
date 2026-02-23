import { setCorsHeaders } from './_lib/cors.js';

export default function handler(req, res) {
  setCorsHeaders(req, res);
  res.json({ ok: true, timestamp: new Date().toISOString() });
}
