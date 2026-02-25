import { useState, useEffect } from 'react';
import { getSessions } from '../utils/storage';

function formatLastWalk(sessions) {
  if (!sessions?.length) return null;
  const last = sessions[0];
  const date = new Date(last.startTime);
  const diffDays = Math.floor((Date.now() - date) / 86400000);
  const dateStr =
    diffDays === 0
      ? 'Today'
      : diffDays === 1
      ? 'Yesterday'
      : diffDays < 7
      ? date.toLocaleDateString('en-US', { weekday: 'long' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const mins = last.endTime ? Math.round((last.endTime - last.startTime) / 60000) : null;
  return { dateStr, timeStr, mins, alertTriggered: last.alertTriggered };
}

export default function HomeScreen({ user, theme, toggleTheme, onStartWalk }) {
  const [lastWalk, setLastWalk] = useState(null);
  const [pressing, setPressing] = useState(false);

  const hour = new Date().getHours();
  const greeting =
    hour < 5  ? 'Still up' :
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening';

  useEffect(() => {
    setLastWalk(formatLastWalk(getSessions()));
  }, []);

  const handleStart = () => {
    onStartWalk({
      destination: user?.homeAddress || '',
      safeWord: user?.safeWord || '',
      contacts: user?.emergencyContacts || [],
    });
  };

  return (
    <div className="screen" style={{ paddingBottom: '84px' }}>

      {/* ── Header ── */}
      <div
        style={{
          padding: '52px 24px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span className="font-brand" style={{ fontSize: '22px', color: 'var(--text)' }}>
          patrona
        </span>

        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☽'}
        </button>
      </div>

      {/* ── Greeting ── */}
      <div style={{ padding: '48px 24px 0' }}>
        <h1
          style={{
            fontSize: '34px',
            fontWeight: 300,
            color: 'var(--text)',
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}
        >
          {greeting},
          <br />
          {user?.name || 'friend'}.
        </h1>
      </div>

      {/* ── Walk Button ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <button
          style={{
            width: '100%',
            maxWidth: '320px',
            padding: '20px 32px',
            borderRadius: '100px',
            background: 'var(--accent)',
            color: 'var(--bg)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.18s, transform 0.14s',
            opacity: pressing ? 0.8 : 1,
            transform: pressing ? 'scale(0.97)' : 'scale(1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            letterSpacing: '0.01em',
          }}
          onPointerDown={() => setPressing(true)}
          onPointerUp={() => { setPressing(false); handleStart(); }}
          onPointerLeave={() => setPressing(false)}
        >
          Walk Me Home
          <span style={{ fontSize: '16px', fontWeight: 400 }}>→</span>
        </button>
      </div>

      {/* ── Last Walk Row ── */}
      <div style={{ padding: '0 24px 16px' }}>
        {lastWalk ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: '4px',
                }}
              >
                Last walk
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 400 }}>
                {lastWalk.dateStr} · {lastWalk.timeStr}
                {lastWalk.mins ? ` · ${lastWalk.mins} min` : ''}
              </p>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '100px',
                fontSize: '11px',
                fontWeight: 500,
                background: lastWalk.alertTriggered
                  ? 'rgba(192, 128, 96, 0.10)'
                  : 'rgba(122, 171, 143, 0.10)',
                color: lastWalk.alertTriggered ? 'var(--alert)' : 'var(--green)',
                border: `1px solid ${lastWalk.alertTriggered ? 'rgba(192,128,96,0.18)' : 'rgba(122,171,143,0.18)'}`,
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: lastWalk.alertTriggered ? 'var(--alert)' : 'var(--green)',
                }}
              />
              {lastWalk.alertTriggered ? 'Alert' : 'Safe'}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 400 }}>
              No walks yet — take your first one tonight.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
