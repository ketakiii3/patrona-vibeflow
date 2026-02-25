import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { saveUser } from '../utils/storage';

const STEP_META = [
  { title: "Let's get you set up", subtitle: 'Takes about a minute' },
  { title: 'Emergency contacts', subtitle: 'Who should we text if you go silent?' },
  { title: 'Your safe word', subtitle: 'A secret signal only you and Patrona know' },
];

export default function Onboarding({ onComplete }) {
  const saveUserToConvex = useMutation(api.users.saveUser);
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    name: '',
    homeAddress: '',
    safeWord: '',
    emergencyContacts: [{ name: '', phone: '', relationship: '' }],
  });

  const update = (field, value) => setUserData((p) => ({ ...p, [field]: value }));

  const updateContact = (i, field, value) => {
    setUserData((p) => {
      const contacts = [...p.emergencyContacts];
      contacts[i] = { ...contacts[i], [field]: value };
      return { ...p, emergencyContacts: contacts };
    });
  };

  const addContact = () => {
    if (userData.emergencyContacts.length >= 3) return;
    setUserData((p) => ({
      ...p,
      emergencyContacts: [...p.emergencyContacts, { name: '', phone: '', relationship: '' }],
    }));
  };

  const removeContact = (i) => {
    if (userData.emergencyContacts.length === 1) return;
    setUserData((p) => ({
      ...p,
      emergencyContacts: p.emergencyContacts.filter((_, idx) => idx !== i),
    }));
  };

  const handleComplete = async () => {
    saveUser(userData);
    saveUserToConvex(userData).catch(() => {});
    onComplete(userData);
  };

  const meta = STEP_META[step - 1];
  const canNext1 = userData.name.trim() && userData.homeAddress.trim();
  const canNext2 =
    userData.emergencyContacts[0]?.name.trim() && userData.emergencyContacts[0]?.phone.trim();
  const canFinish = userData.safeWord.trim().length >= 2;

  return (
    <div className="screen" style={{ padding: '0 24px', paddingBottom: '32px' }}>
      {/* Top spacer + brand */}
      <div style={{ height: '52px' }} />
      <div style={{ marginBottom: '32px' }}>
        <span className="font-brand" style={{ fontSize: '20px', color: 'var(--text)' }}>
          patrona
        </span>
      </div>

      {/* Step counter */}
      <p
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-3)',
          letterSpacing: '0.04em',
          marginBottom: '28px',
        }}
      >
        {step} of 3
      </p>

      {/* Heading */}
      <div style={{ marginBottom: '32px' }}>
        <h2
          style={{
            fontSize: '26px',
            fontWeight: 300,
            color: 'var(--text)',
            lineHeight: 1.25,
            marginBottom: '6px',
            letterSpacing: '-0.01em',
          }}
        >
          {meta.title}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-2)', fontWeight: 400 }}>
          {meta.subtitle}
        </p>
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div>
            <div className="label-xs" style={{ marginBottom: '8px' }}>Your first name</div>
            <input
              className="sw-input"
              type="text"
              value={userData.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g., Katie"
              autoFocus
            />
          </div>

          <div>
            <div className="label-xs" style={{ marginBottom: '8px' }}>Home address</div>
            <input
              className="sw-input"
              type="text"
              value={userData.homeAddress}
              onChange={(e) => update('homeAddress', e.target.value)}
              placeholder="123 W 116th St, New York, NY"
            />
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '6px', paddingLeft: '2px' }}>
              Patrona will use this as your default destination
            </p>
          </div>

          <div style={{ flex: 1 }} />

          <button className="btn-primary" onClick={() => setStep(2)} disabled={!canNext1}>
            Continue
          </button>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6 }}>
            If you stop responding during a walk, Patrona will text these people with your live GPS location.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {userData.emergencyContacts.map((contact, i) => (
              <div key={i} className="contact-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--text-3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                    }}
                  >
                    Contact {i + 1}
                  </span>
                  {i > 0 && (
                    <button
                      onClick={() => removeContact(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-3)',
                        cursor: 'pointer',
                        fontSize: '18px',
                        lineHeight: 1,
                        padding: '4px',
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
                <input
                  className="sw-input"
                  type="text"
                  value={contact.name}
                  onChange={(e) => updateContact(i, 'name', e.target.value)}
                  placeholder="Name"
                  style={{ padding: '12px 14px' }}
                />
                <input
                  className="sw-input"
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => updateContact(i, 'phone', e.target.value)}
                  placeholder="+1 555-123-4567"
                  style={{ padding: '12px 14px' }}
                />
                <input
                  className="sw-input"
                  type="text"
                  value={contact.relationship}
                  onChange={(e) => updateContact(i, 'relationship', e.target.value)}
                  placeholder="Relationship (e.g., roommate, mom)"
                  style={{ padding: '12px 14px' }}
                />
              </div>
            ))}
          </div>

          {userData.emergencyContacts.length < 3 && (
            <button
              onClick={addContact}
              style={{
                background: 'none',
                border: '1px dashed var(--border)',
                borderRadius: '10px',
                padding: '14px',
                color: 'var(--accent)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
            >
              + Add another contact
            </button>
          )}

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={() => setStep(1)}
              style={{ flex: '0 0 80px' }}
            >
              ←
            </button>
            <button
              className="btn-primary"
              onClick={() => setStep(3)}
              disabled={!canNext2}
              style={{ flex: 1 }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div>
            <div className="label-xs" style={{ marginBottom: '8px' }}>Safe word or phrase</div>
            <input
              className="sw-input"
              type="text"
              value={userData.safeWord}
              onChange={(e) => update('safeWord', e.target.value)}
              placeholder="e.g., red balloon, purple elephant"
              autoFocus
            />
          </div>

          <div className="hint-box">
            <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.65, fontWeight: 400 }}>
              When you say your safe word, Patrona will{' '}
              <strong style={{ color: 'var(--text)', fontWeight: 500 }}>keep talking completely normally</strong>{' '}
              — no alarm, no announcement. Your contacts get alerted{' '}
              <strong style={{ color: 'var(--text)', fontWeight: 500 }}>silently in the background.</strong>
            </p>
          </div>

          <div
            style={{
              padding: '14px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-3)',
                marginBottom: '4px',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Good safe words are
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
              Unusual phrases that wouldn't come up in normal conversation — "purple dinosaur," "ocean breeze," "lemon drop."
            </p>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={() => setStep(2)}
              style={{ flex: '0 0 80px' }}
            >
              ←
            </button>
            <button
              className="btn-primary"
              onClick={handleComplete}
              disabled={!canFinish}
              style={{ flex: 1 }}
            >
              Start using Patrona
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
