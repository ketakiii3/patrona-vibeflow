import { useState, useEffect } from 'react';
import { useAuth, SignIn } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { hasUser, getUser, saveUser, setStorageUserId } from './utils/storage';
import Onboarding from './components/Onboarding';
import HomeScreen from './components/HomeScreen';
import WalkScreen from './components/WalkScreen';
import AlertScreen from './components/AlertScreen';
import ArrivedScreen from './components/ArrivedScreen';
import TrackingPage from './components/TrackingPage';
import HistoryScreen from './components/HistoryScreen';
import SettingsScreen from './components/SettingsScreen';
import BottomNav from './components/BottomNav';

export default function App() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('home');
  const [walkState, setWalkState] = useState('idle');
  const [walkSession, setWalkSession] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('sw_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sw_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const isTrackingPage =
    window.location.pathname === '/track' ||
    new URLSearchParams(window.location.search).has('tracking');

  const cloudUser = useQuery(
    api.users.getUser,
    isSignedIn ? undefined : "skip"
  );

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      setStorageUserId('');
      setUser(null);
      setIsOnboarded(false);
      return;
    }

    setStorageUserId(userId);

    if (cloudUser) {
      saveUser(cloudUser);
      setIsOnboarded(true);
      setUser(cloudUser);
    } else if (cloudUser === null) {
      const onboarded = hasUser();
      setIsOnboarded(onboarded);
      if (onboarded) setUser(getUser());
    }
  }, [isLoaded, isSignedIn, userId, cloudUser]);

  if (isTrackingPage) return <TrackingPage />;

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <SignIn />
      </div>
    );
  }

  if (!isOnboarded) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--bg)' }}>
        <Onboarding
          onComplete={(userData) => {
            setUser(userData);
            setIsOnboarded(true);
          }}
        />
      </div>
    );
  }

  const isWalking = walkState !== 'idle';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--bg)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {isWalking ? (
          <>
            {(walkState === 'walking' || walkState === 'alert') && (
              <div style={{ display: walkState === 'alert' ? 'none' : 'contents' }}>
                <WalkScreen
                  key="walk"
                  user={user}
                  walkSession={walkSession}
                  onAlert={() => setWalkState('alert')}
                  onArrived={() => setWalkState('arrived')}
                />
              </div>
            )}
            {walkState === 'alert' && (
              <AlertScreen
                key="alert"
                user={user}
                walkSession={walkSession}
                onSafe={() => setWalkState('walking')}
                onEndWalk={() => setWalkState('arrived')}
              />
            )}
            {walkState === 'arrived' && (
              <ArrivedScreen
                key="arrived"
                walkSession={walkSession}
                onDone={() => {
                  setWalkSession(null);
                  setWalkState('idle');
                  setTab('home');
                }}
              />
            )}
          </>
        ) : (
          <>
            {tab === 'home' && (
              <HomeScreen
                key="home"
                user={user}
                theme={theme}
                toggleTheme={toggleTheme}
                onStartWalk={(session) => {
                  setWalkSession({ ...session, startTime: Date.now(), sessionId: crypto.randomUUID() });
                  setWalkState('walking');
                }}
              />
            )}
            {tab === 'history' && <HistoryScreen key="history" />}
            {tab === 'settings' && (
              <SettingsScreen
                key="settings"
                user={user}
                theme={theme}
                toggleTheme={toggleTheme}
                onUserUpdate={(u) => setUser(u)}
              />
            )}
            <BottomNav activeTab={tab} onTabChange={setTab} />
          </>
        )}
      </div>
    </div>
  );
}
