import { useState, useEffect, useRef, useCallback } from 'react';
import { getDistanceMeters } from '../utils/maps';

export default function useGPS(isActive = false) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [positionHistory, setPositionHistory] = useState([]);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setPosition(newPos);
        setPositionHistory((prev) => [...prev.slice(-60), newPos]); // Keep last 60 pings
        setError(null);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isActive]);

  // Returns true if user has been stationary for thresholdSeconds
  const hasStoppedMoving = useCallback(
    (thresholdMeters = 10, thresholdSeconds = 90) => {
      if (positionHistory.length < 2) return false;
      const recent = positionHistory[positionHistory.length - 1];
      const earlier = positionHistory.find(
        (p) => recent.timestamp - p.timestamp >= thresholdSeconds * 1000
      );
      if (!earlier) return false;
      return getDistanceMeters(earlier.lat, earlier.lng, recent.lat, recent.lng) < thresholdMeters;
    },
    [positionHistory]
  );

  return { position, error, positionHistory, hasStoppedMoving };
}
