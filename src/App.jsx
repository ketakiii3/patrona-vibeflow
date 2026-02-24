import { useState, useEffect } from 'react';
import { useAuth, SignIn } from '@clerk/clerk-react';
import { hasUser, getUser, setStorageUserId } from './utils/storage';
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
  const [tab, setTab] = useState('home'); // home | history | settings
  const [walkState, setWalkState] = useState('idle'); // idle | walking | alert | arrived
  const [walkSession, setWalkSession] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('sw_theme') || 'dark');

  // Apply theme to <html> and persist it
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sw_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // Check if this is the emergency contact tracking page
  const isTrackingPage =
    window.location.pathname === '/track' ||
    new URLSearchParams(window.location.search).has('tracking');

  // Load onboarding state from localStorage once Clerk confirms user is signed in
  useEffect(() => {
    if (!isSignedIn || !userId) return;
    setStorageUserId(userId); // Scope all storage to this Clerk user
    const onboarded = hasUser();
    setIsOnboarded(onboarded);
    if (onboarded) setUser(getUser());
  }, [isSignedIn, userId]);

  // 1. TrackingPage — PUBLIC, no auth required (emergency contacts must see this)
  if (isTrackingPage) return <TrackingPage />;

  // 2. Wait for Clerk to finish initialising
  if (!isLoaded) return null;

  // 3. Auth gate — show Clerk's built-in sign-in form
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

  // 4. Onboarding gate — signed in but hasn't set up profile yet
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

  // 5. Main app — signed in + onboarded
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
      {/* Subtle ambient layer — no colored gradients */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--bg)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content layer */}
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {isWalking ? (
          <>
            {/* Keep WalkScreen mounted during alert so voice session stays alive */}
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
