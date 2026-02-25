import { useState, useEffect } from 'react';
import { getSessions } from '../utils/storage';

function formatDate(ts) {
  const date = new Date(ts);
  const diffDays = Math.floor((Date.now() - date) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDuration(startTime, endTime) {
  if (!endTime) return null;
  const mins = Math.round((endTime - startTime) / 60000);
  return `${mins} min`;
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  return (
    <div className="screen" style={{ paddingBottom: '84px', paddingTop: '0' }}>
      {/* Header */}
      <div style={{ padding: '52px 24px 24px' }}>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 300,
            color: 'var(--text)',
            marginBottom: '4px',
            letterSpacing: '-0.01em',
          }}
        >
          Walk History
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 400 }}>
          {sessions.length
            ? `${sessions.length} walk${sessions.length !== 1 ? 's' : ''} recorded`
            : 'No walks yet'}
        </p>
      </div>

      {/* List */}
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sessions.length === 0 && (
          <div
            style={{
              padding: '64px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--text-2)', fontSize: '15px', fontWeight: 400 }}>
              Your walks will appear here
            </p>
            <p style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 400, maxWidth: '220px' }}>
              Head to Home and tap Walk Me Home to get started
            </p>
          </div>
        )}

        {sessions.map((session) => {
          const duration = formatDuration(session.startTime, session.endTime);
          const isAlert = session.alertTriggered;
          const isCancelled = session.status === 'cancelled';

          // Status indicator color
          const statusColor = isAlert
            ? 'var(--alert)'
            : isCancelled
            ? 'var(--text-3)'
            : 'var(--green)';

          const statusLabel = isAlert ? 'Alert' : isCancelled ? 'Cancelled' : 'Safe';

          return (
            <div key={session.id || session.startTime} className="history-item">
              {/* Status dot */}
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: statusColor,
                  flexShrink: 0,
                  marginLeft: '2px',
                }}
              />

              {/* Walk info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>
                  {formatDate(session.startTime)}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 400 }}>
                  {formatTime(session.startTime)}
                  {duration ? ` · ${duration}` : ''}
                </p>
              </div>

              {/* Status badge */}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 400,
                  color: statusColor,
                }}
              >
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>

      {sessions.length > 0 && (
        <div style={{ padding: '20px 24px 0', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 400 }}>
            Showing last {sessions.length} walk{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
