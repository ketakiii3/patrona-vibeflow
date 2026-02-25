import { useState, useEffect } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { saveSession } from '../utils/storage';

function useElapsed(startTime) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AlertScreen({ user, walkSession, onSafe, onEndWalk }) {
  const sendAllClear = useAction(api.alerts.sendAllClear);
  const [isSending, setIsSending] = useState(false);
  const [cleared, setCleared] = useState(false);
  const timer = useElapsed(walkSession?.startTime || Date.now());

  const handleImSafe = async () => {
    setIsSending(true);
    try {
      if (walkSession?.contacts?.length) {
        await sendAllClear({
          userName: user?.name || 'Someone',
          contacts: walkSession.contacts,
        });
      }
    } catch {
      // Proceed anyway
    }
    setCleared(true);
    setIsSending(false);
    setTimeout(() => onSafe(), 800);
  };

  const handleEndWalk = () => {
    saveSession({
      startTime: walkSession?.startTime,
      endTime: Date.now(),
      status: 'completed',
      alertTriggered: true,
      id: walkSession?.startTime?.toString(),
    });
    onEndWalk();
  };

  // Alert screen uses a warm tinted background
  const alertBg = 'var(--data-theme, #1c1510)';

  return (
    <div
      className="screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'color-mix(in srgb, var(--bg) 92%, var(--alert) 8%)',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          width: '100%',
          padding: '52px 24px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '100px',
            fontSize: '12px',
            fontWeight: 500,
            background: 'rgba(192, 128, 96, 0.12)',
            color: 'var(--alert)',
            border: '1px solid rgba(192, 128, 96, 0.2)',
          }}
        >
          Alert Active
        </div>
        <div className="elapsed-badge">{timer}</div>
      </div>

      {/* Center content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '28px',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        {/* Large status text */}
        <div>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 300,
              color: 'var(--text)',
              marginBottom: '10px',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            Alert sent.
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-2)', fontWeight: 400, lineHeight: 1.6 }}>
            Your contacts have been notified.
          </p>
        </div>

        {/* Waveform bars — alert color */}
        <div className="wave-bars active alert-bars">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="wave-bar" />
          ))}
        </div>

        {/* Contact chips */}
        {walkSession?.contacts?.length > 0 && (
          <div
            style={{
              width: '100%',
              maxWidth: '320px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-3)',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: '4px',
              }}
            >
              Contacts notified
            </p>
            {walkSession.contacts.map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(192, 128, 96, 0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: 'var(--alert)',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {c.name?.[0] || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{c.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>{c.relationship || c.phone}</p>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--alert)',
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  Notified
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div
        style={{
          width: '100%',
          padding: '0 24px 52px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <button
          className="btn-alert"
          onClick={handleImSafe}
          disabled={isSending || cleared}
        >
          {cleared ? 'All-clear sent' : isSending ? 'Sending...' : "I'm Safe"}
        </button>
        <button className="btn-ghost" onClick={handleEndWalk}>
          End walk
        </button>
      </div>
    </div>
  );
}
