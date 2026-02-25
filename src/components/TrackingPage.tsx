import { useEffect, useState } from 'react';
import { loadGoogleMaps } from '../utils/maps';

export default function TrackingPage() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const lat = parseFloat(params.get('lat'));
  const lng = parseFloat(params.get('lng'));
  const name = params.get('name') || 'Your friend';
  const ts = params.get('ts') ? new Date(parseInt(params.get('ts'))).toLocaleTimeString() : null;

  const isValid = !isNaN(lat) && !isNaN(lng);
  const mapsLink = isValid ? `https://www.google.com/maps?q=${lat},${lng}` : '#';

  useEffect(() => {
    if (!isValid) return;

    loadGoogleMaps()
      .then((maps) => {
        const mapEl = document.getElementById('tracking-map');
        if (!mapEl) return;

        const map = new maps.Map(mapEl, {
          center: { lat, lng },
          zoom: 16,
          disableDefaultUI: true,
          gestureHandling: 'cooperative',
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#181714' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#8c8680' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#181714' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1c1b18' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#242320' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0c' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          ],
        });

        new maps.Marker({
          position: { lat, lng },
          map,
          title: name,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#87a696',
            fillOpacity: 1,
            strokeColor: '#e8e4dd',
            strokeWeight: 2,
          },
        });

        setMapLoaded(true);
      })
      .catch(() => setMapError(true));
  }, [lat, lng, name, isValid]);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: 'var(--text)',
      }}
    >
      {/* Alert banner */}
      <div
        style={{
          background: 'var(--alert)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em' }}>
          Patrona Alert — {name} may need help
        </p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>
          {ts ? `Last update: ${ts}` : `As of ${new Date().toLocaleTimeString()}`}
        </p>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {isValid ? (
          <div id="tracking-map" style={{ width: '100%', height: '100%' }} />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '32px', color: 'var(--text-3)' }}>—</span>
            <p style={{ color: 'var(--text-3)', fontWeight: 400 }}>
              {mapError ? 'Could not load map' : 'Location unavailable'}
            </p>
          </div>
        )}

        {/* Loading overlay */}
        {isValid && !mapLoaded && !mapError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '2px solid var(--border)',
                borderTopColor: 'var(--accent)',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Loading map...</p>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          padding: '20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, fontWeight: 400 }}>
          <strong style={{ color: 'var(--text)', fontWeight: 500 }}>{name}</strong> hasn't responded
          to Patrona check-ins during their walk home. Their last known location is shown above.
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="tel:911"
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '100px',
              background: '#c0392b',
              color: 'white',
              textAlign: 'center',
              fontWeight: 500,
              fontSize: '14px',
              textDecoration: 'none',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Call 911
          </a>

          {isValid && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '100px',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--accent)',
                textAlign: 'center',
                fontWeight: 400,
                fontSize: '14px',
                textDecoration: 'none',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Open in Maps
            </a>
          )}
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', fontWeight: 400 }}>
          Powered by Patrona — AI safety companion
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
