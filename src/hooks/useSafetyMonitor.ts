import { useState, useEffect, useRef, useCallback } from 'react';

const TIER_1_SILENCE_SECS = 90;   // Gentle check-in after 90s silence
const TIER_2_WAIT_SECS    = 20;   // Firmer check-in 20s after Tier 1
const TIER_3_WAIT_SECS    = 30;   // Emergency alert 30s after Tier 2

export default function useSafetyMonitor({
  isActive,
  safeWord,
  onTier1,
  onTier2,
  onTier3,
  onSafeWord,
}) {
  const [currentTier, setCurrentTier] = useState(0);
  const [isAlertActive, setIsAlertActive] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef(null);
  const tierRef = useRef(0); // Sync ref so interval sees latest tier

  const registerVoiceActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (tierRef.current > 0 && tierRef.current < 3) {
      tierRef.current = 0;
      setCurrentTier(0);
    }
  }, []);

  const checkForSafeWord = useCallback(
    (transcript) => {
      if (!safeWord || !transcript) return false;
      const normalized = transcript.toLowerCase().trim();
      const word = safeWord.toLowerCase().trim();
      if (normalized.includes(word)) {
        // Silent — do NOT log or show any indication
        setIsAlertActive(true);
        if (onSafeWord) onSafeWord();
        return true;
      }
      return false;
    },
    [safeWord, onSafeWord]
  );

  const deactivateAlert = useCallback(() => {
    setIsAlertActive(false);
    tierRef.current = 0;
    setCurrentTier(0);
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      tierRef.current = 0;
      setCurrentTier(0);
      setIsAlertActive(false);
      return;
    }

    lastActivityRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const silenceSecs = (Date.now() - lastActivityRef.current) / 1000;
      const tier = tierRef.current;

      if (tier === 0 && silenceSecs >= TIER_1_SILENCE_SECS) {
        tierRef.current = 1;
        setCurrentTier(1);
        onTier1?.();
      } else if (
        tier === 1 &&
        silenceSecs >= TIER_1_SILENCE_SECS + TIER_2_WAIT_SECS
      ) {
        tierRef.current = 2;
        setCurrentTier(2);
        onTier2?.();
      } else if (
        tier === 2 &&
        silenceSecs >= TIER_1_SILENCE_SECS + TIER_2_WAIT_SECS + TIER_3_WAIT_SECS
      ) {
        tierRef.current = 3;
        setCurrentTier(3);
        setIsAlertActive(true);
        onTier3?.();
      }
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, onTier1, onTier2, onTier3]);

  return {
    currentTier,
    isAlertActive,
    registerVoiceActivity,
    checkForSafeWord,
    deactivateAlert,
  };
}
