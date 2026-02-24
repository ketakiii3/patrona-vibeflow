const VALID_TRIGGER_TYPES = new Set(['safeword', 'silence', 'deviation']);

/** E.164: optional + followed by 7–15 digits */
const E164_RE = /^\+?[1-9]\d{6,14}$/;

export function validateAlertBody(body) {
  const { userName, contacts, latitude, longitude, triggerType } = body || {};

  if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
    return 'userName is required';
  }
  if (userName.length > 100) return 'userName too long';

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return 'contacts must be a non-empty array';
  }
  if (contacts.length > 10) return 'Too many contacts (max 10)';

  for (const c of contacts) {
    const phone = c?.phone?.replace(/[\s\-\(\)]/g, '');
    if (!phone || !E164_RE.test(phone)) {
      return `Invalid phone number: ${c?.phone}`;
    }
  }

  // Coords are optional — alert still sends without location
  if (latitude !== undefined && latitude !== null) {
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      return 'latitude must be a number between -90 and 90';
    }
  }
  if (longitude !== undefined && longitude !== null) {
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      return 'longitude must be a number between -180 and 180';
    }
  }

  if (triggerType && !VALID_TRIGGER_TYPES.has(triggerType)) {
    return 'triggerType must be safeword, silence, or deviation';
  }

  return null; // valid
}

export function validateClearBody(body) {
  const { userName, contacts } = body || {};

  if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
    return 'userName is required';
  }
  if (userName.length > 100) return 'userName too long';

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return 'contacts must be a non-empty array';
  }
  if (contacts.length > 10) return 'Too many contacts (max 10)';

  for (const c of contacts) {
    const phone = c?.phone?.replace(/[\s\-\(\)]/g, '');
    if (!phone || !E164_RE.test(phone)) {
      return `Invalid phone number: ${c?.phone}`;
    }
  }

  return null;
}

export function validatePingBody(body) {
  const { sessionId, latitude, longitude } = body || {};

  if (!sessionId || typeof sessionId !== 'string') return null; // ping is optional

  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    return 'latitude must be a number between -90 and 90';
  }
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    return 'longitude must be a number between -180 and 180';
  }

  return null;
}
