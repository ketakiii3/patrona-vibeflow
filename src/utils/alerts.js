const API_URL = import.meta.env.VITE_API_URL || '';
const API_SECRET = import.meta.env.VITE_API_SECRET || '';

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (API_SECRET) headers['X-Api-Key'] = API_SECRET;
  return headers;
}

export async function sendEmergencyAlert({ userName, contacts, latitude, longitude, triggerType }) {
  try {
    const response = await fetch(`${API_URL}/api/alert`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userName, contacts, latitude, longitude, triggerType }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to send alert:', error);
    return { success: false, error: error.message };
  }
}

export async function sendAllClear({ userName, contacts }) {
  try {
    const response = await fetch(`${API_URL}/api/alert/clear`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userName, contacts }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to send all-clear:', error);
    return { success: false, error: error.message };
  }
}

export async function pingLocation({ sessionId, latitude, longitude }) {
  try {
    await fetch(`${API_URL}/api/ping`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ sessionId, latitude, longitude, timestamp: Date.now() }),
    });
  } catch {
    // Silent — pings are best-effort
  }
}
