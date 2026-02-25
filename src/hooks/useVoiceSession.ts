import { useCallback, useState, useRef } from 'react';
import { Conversation } from '@elevenlabs/client';

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

export default function useVoiceSession({ userName, safeWord, onTranscript, onSessionEnd }) {
  const [status, setStatus] = useState('idle'); // idle | connecting | connected | ended
  const [isSpeaking, setIsSpeaking] = useState(false);
  const conversationRef = useRef(null);

  const startSession = useCallback(async () => {
    if (!AGENT_ID) {
      console.warn('No ElevenLabs Agent ID set. Voice session disabled.');
      setStatus('connected');
      return;
    }

    // Prevent double-start
    if (conversationRef.current) return;

    setStatus('connecting');

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        onConnect: () => setStatus('connected'),
        onDisconnect: () => {
          conversationRef.current = null;
          setStatus('ended');
          setIsSpeaking(false);
          onSessionEnd?.();
        },
        onError: (err) => {
          console.error('Voice session error:', err);
          conversationRef.current = null;
          setStatus('idle');
        },
        onModeChange: ({ mode }) => {
          setIsSpeaking(mode === 'speaking');
          onTranscript?.('__activity__');
        },
        onMessage: ({ source, message }) => {
          if (source === 'user' && message) {
            onTranscript?.(message);
          }
        },
      });

      conversationRef.current = conversation;
    } catch (error) {
      console.error('Failed to start voice session:', error);
      setStatus('idle');
    }
  }, [userName, safeWord, onTranscript, onSessionEnd]);

  const endSession = useCallback(async () => {
    const conv = conversationRef.current;
    if (conv) {
      conversationRef.current = null;
      try {
        await conv.endSession();
      } catch {
        // Ignore errors on end
      }
    }
    setStatus('ended');
    setIsSpeaking(false);
  }, []);

  return { status, isSpeaking, startSession, endSession };
}
