// Storage keys are scoped per Clerk user ID to prevent data leaking between accounts
let _userId = 'anon';

export function setStorageUserId(id) {
  _userId = id || 'anon';
}

function userKey()     { return `patrona_user_${_userId}`; }
function sessionsKey() { return `patrona_sessions_${_userId}`; }

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
