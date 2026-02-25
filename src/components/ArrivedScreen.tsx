import { useEffect, useState } from 'react';

export default function ArrivedScreen({ walkSession, onDone }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 120);
    return () => clearTimeout(t);
  }, []);

  const duration =
    walkSession?.endTime && walkSession?.startTime
      ? Math.round((walkSession.endTime - walkSession.startTime) / 60000)
      : null;

  return (
    <div
      className="screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 28px',
        background: 'color-mix(in srgb, var(--bg) 93%, var(--green) 7%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '28px',
          animation: show ? 'scalePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
          opacity: show ? undefined : 0,
        }}
      >
        {/* Checkmark icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: 'var(--bg)',
            fontWeight: 300,
          }}
        >
          ✓
        </div>

        {/* Text */}
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
            You made it home.
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-2)', fontWeight: 400 }}>
            Stay safe out there.
          </p>
        </div>

        {/* Walk stat */}
        {duration !== null && (
          <div
            style={{
              padding: '14px 28px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              display: 'flex',
              gap: '32px',
              alignItems: 'center',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontSize: '28px',
                  fontWeight: 300,
                  color: 'var(--green)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {duration}
              </p>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginTop: '4px',
                }}
              >
                min
              </p>
            </div>
            <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontSize: '28px',
                  fontWeight: 300,
                  color: 'var(--green)',
                  lineHeight: 1,
                }}
              >
                ✓
              </p>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginTop: '4px',
                }}
              >
                safe
              </p>
            </div>
          </div>
        )}

        <button
          className="btn-primary"
          onClick={onDone}
          style={{ width: '160px', marginTop: '8px' }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
