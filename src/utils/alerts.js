const API_URL = import.meta.env.VITE_API_URL || '';

async function authHeaders(getToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (getToken) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function sendEmergencyAlert({ userName, contacts, latitude, longitude, triggerType, getToken }) {
  try {
    const response = await fetch(`${API_URL}/api/alert`, {
      method: 'POST',
      headers: await authHeaders(getToken),
      body: JSON.stringify({ userName, contacts, latitude, longitude, triggerType }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('[Alert] API error:', response.status, data);
      return { success: false, error: data.error || `HTTP ${response.status}` };
    }
    return data;
  } catch (error) {
    console.error('[Alert] Network error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendAllClear({ userName, contacts, getToken }) {
  try {
    const response = await fetch(`${API_URL}/api/alert/clear`, {
      method: 'POST',
      headers: await authHeaders(getToken),
      body: JSON.stringify({ userName, contacts }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('[All-clear] API error:', response.status, data);
      return { success: false, error: data.error || `HTTP ${response.status}` };
    }
    return data;
  } catch (error) {
    console.error('[All-clear] Network error:', error);
    return { success: false, error: error.message };
  }
}

export async function pingLocation({ sessionId, latitude, longitude, getToken }) {
  try {
    await fetch(`${API_URL}/api/ping`, {
      method: 'POST',
      headers: await authHeaders(getToken),
      body: JSON.stringify({ sessionId, latitude, longitude, timestamp: Date.now() }),
    });
  } catch {
    // Silent — pings are best-effort
  }
}
