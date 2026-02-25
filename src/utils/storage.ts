// Storage keys are scoped per Clerk user ID to prevent data leaking between accounts.
// The userId is also persisted to localStorage so it survives page reloads before
// Clerk finishes its async initialization (avoids timing race with module-level var).

let _userId = 'anon';

export function setStorageUserId(id) {
  _userId = id || 'anon';
  if (id) {
    localStorage.setItem('patrona_uid', id);
  } else {
    localStorage.removeItem('patrona_uid');
  }
}

function getUserId() {
  if (_userId !== 'anon') return _userId;
  // Fallback: read persisted uid in case module re-initialized before Clerk loaded
  return localStorage.getItem('patrona_uid') || 'anon';
}

function userKey()     { return `patrona_user_${getUserId()}`; }
function sessionsKey() { return `patrona_sessions_${getUserId()}`; }

export function hasUser() {
  try {
    const raw = localStorage.getItem(userKey());
    if (!raw) return false;
    const user = JSON.parse(raw);
    return !!(user?.name && user?.safeWord);
  } catch {
    return false;
  }
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(userKey()) || 'null');
  } catch {
    return null;
  }
}

export function saveUser(userData) {
  localStorage.setItem(userKey(), JSON.stringify(userData));
}

export function getSessions() {
  try {
    return JSON.parse(localStorage.getItem(sessionsKey()) || '[]');
  } catch {
    return [];
  }
}

export function saveSession(session) {
  const sessions = getSessions();
  sessions.unshift(session);
  localStorage.setItem(sessionsKey(), JSON.stringify(sessions.slice(0, 50)));
}

export function clearUser() {
  localStorage.removeItem(userKey());
}
