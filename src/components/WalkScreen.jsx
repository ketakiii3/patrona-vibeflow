import { useEffect, useRef, useState, useCallback } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import useGPS from '../hooks/useGPS';
import useSafetyMonitor from '../hooks/useSafetyMonitor';
import useVoiceSession from '../hooks/useVoiceSession';
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

export default function WalkScreen({ user, walkSession, onAlert, onArrived }) {
  const sendAlert = useAction(api.alerts.sendEmergencyAlert);
  const upsertPing = useMutation(api.locationPings.upsertPing);
  const upsertPingRef = useRef(upsertPing);
  useEffect(() => { upsertPingRef.current = upsertPing; }, [upsertPing]);

  const timer = useElapsed(walkSession?.startTime || Date.now());
  const hasAlertedRef = useRef(false);
  const pingIntervalRef = useRef(null);

  const gps = useGPS(true);
  const gpsRef = useRef(null);

  useEffect(() => {
    gpsRef.current = gps.position;
  }, [gps.position]);

  useEffect(() => {
    const sessionId = walkSession?.sessionId;

    pingIntervalRef.current = setInterval(() => {
      const pos = gpsRef.current;
      if (pos) {
        upsertPingRef.current({
          sessionId,
          latitude: pos.lat,
          longitude: pos.lng,
          timestamp: Date.now(),
        }).catch(() => {});
      }
    }, 10000);

    return () => clearInterval(pingIntervalRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerAlert = useCallback(
    async (triggerType) => {
      if (hasAlertedRef.current) return;
      hasAlertedRef.current = true;

      const pos = gpsRef.current;
      console.log('[Alert] Triggered:', triggerType, '| contacts:', walkSession?.contacts?.length, '| gps:', !!pos);
      if (walkSession?.contacts?.length) {
        try {
          const result = await sendAlert({
            userName: user?.name || 'Someone',
            contacts: walkSession.contacts,
            ...(pos ? { latitude: pos.lat, longitude: pos.lng } : {}),
            triggerType,
          });
          console.log('[Alert] Result:', JSON.stringify(result));
        } catch (err) {
          console.error('[Alert] Error:', err);
        }
      } else {
        console.warn('[Alert] No contacts — SMS skipped');
      }
      onAlert();
    },
    [gps.position, walkSession, user, onAlert, sendAlert]
  );

  const safety = useSafetyMonitor({
    isActive: true,
    safeWord: walkSession?.safeWord || user?.safeWord,
    onTier1: () => {},
    onTier2: () => {},
    onTier3: () => triggerAlert('silence'),
    onSafeWord: () => triggerAlert('safeword'),
  });

  const voice = useVoiceSession({
    userName: user?.name || 'friend',
    safeWord: walkSession?.safeWord || user?.safeWord,
    onTranscript: (t) => {
      safety.registerVoiceActivity();
      safety.checkForSafeWord(t);
    },
    onSessionEnd: () => {},
  });

  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  // Auto-start voice on mount
  useEffect(() => {
    voiceRef.current.startSession();
    return () => { voiceRef.current.endSession(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [ending, setEnding] = useState(false);

  const handleImHome = async () => {
    if (ending) return;
    setEnding(true);
    clearInterval(pingIntervalRef.current);
    await voice.endSession();
    saveSession({
      startTime: walkSession?.startTime,
      endTime: Date.now(),
      status: 'completed',
      alertTriggered: false,
      id: walkSession?.startTime?.toString(),
    });
    onArrived();
  };

  const handleCancel = async () => {
    if (ending) return;
    setEnding(true);
    clearInterval(pingIntervalRef.current);
    await voice.endSession();
    saveSession({
      startTime: walkSession?.startTime,
      endTime: Date.now(),
      status: 'cancelled',
      alertTriggered: false,
      id: walkSession?.startTime?.toString(),
    });
    onArrived();
  };

  const isConnected = voice.status === 'connected';
  const isConnecting = voice.status === 'connecting';

  const statusLabel =
    isConnecting ? 'Connecting...' :
    voice.isSpeaking ? 'Patrona is speaking' :
    isConnected ? 'Listening...' :
    'Starting up...';

  return (
    <div
      className="screen"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          width: '100%',
          padding: '52px 24px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Elapsed timer */}
        <div className="elapsed-badge">
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isConnected ? 'var(--green)' : 'var(--text-3)',
              animation: isConnected ? 'pulseDot 2s ease-in-out infinite' : 'none',
            }}
          />
          {timer}
        </div>

        {/* GPS status pill */}
        <div className="location-pill">
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>GPS</span>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>
            {gps.position
              ? `${gps.position.lat.toFixed(4)}, ${gps.position.lng.toFixed(4)}`
              : gps.error
              ? 'No signal'
              : 'Locating...'}
          </span>
        </div>
      </div>

      {/* ── Center content ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          padding: '16px 24px',
        }}
      >
        {/* Status text */}
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: '22px',
              fontWeight: 300,
              color: 'var(--text)',
              marginBottom: '8px',
              letterSpacing: '-0.01em',
            }}
          >
            {statusLabel}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 400 }}>
            {isConnecting
              ? 'Setting up your companion'
              : isConnected
              ? 'Your companion is right here'
              : ''}
          </p>
        </div>

        {/* Waveform bars */}
        <div className={`wave-bars ${isConnected ? 'active' : ''}`}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="wave-bar" />
          ))}
        </div>

        {/* Destination info */}
        {walkSession?.destination && (
          <div
            style={{
              padding: '10px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              maxWidth: '280px',
              textAlign: 'center',
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
              Heading to
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 400 }}>
              {walkSession.destination}
            </p>
          </div>
        )}
      </div>

      {/* ── Bottom actions ── */}
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
        <button className="btn-green" onClick={handleImHome}>
          I'm Home
        </button>
        <button className="btn-ghost" onClick={handleCancel}>
          Cancel walk
        </button>
      </div>
    </div>
  );
}
