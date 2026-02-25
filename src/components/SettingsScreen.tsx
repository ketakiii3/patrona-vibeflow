import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { saveUser } from '../utils/storage';

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <p className="section-header">{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{children}</div>
    </div>
  );
}

export default function SettingsScreen({ user, theme, toggleTheme, onUserUpdate }) {
  const saveUserToConvex = useMutation(api.users.saveUser);
  const [editing, setEditing] = useState(null);
  const [localUser, setLocalUser] = useState({ ...user });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveUser(localUser);
    saveUserToConvex(localUser).catch(() => {});
    onUserUpdate(localUser);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setEditing(null);
    }, 1000);
  };

  const updateField = (field, value) => {
    setLocalUser((p) => ({ ...p, [field]: value }));
  };

  const updateContact = (i, field, value) => {
    setLocalUser((p) => {
      const contacts = [...(p.emergencyContacts || [])];
      contacts[i] = { ...contacts[i], [field]: value };
      return { ...p, emergencyContacts: contacts };
    });
  };

  const addContact = () => {
    setLocalUser((p) => ({
      ...p,
      emergencyContacts: [...(p.emergencyContacts || []), { name: '', phone: '', relationship: '' }],
    }));
  };

  const removeContact = (i) => {
    setLocalUser((p) => ({
      ...p,
      emergencyContacts: p.emergencyContacts.filter((_, idx) => idx !== i),
    }));
  };

  // Edit modal view
  if (editing) {
    return (
      <div className="screen" style={{ padding: '52px 24px 32px' }}>
        {/* Back header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <button
            onClick={() => { setEditing(null); setLocalUser({ ...user }); }}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '7px 14px',
              color: 'var(--text-2)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 400,
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
          <h3 style={{ fontSize: '17px', fontWeight: 500, color: 'var(--text)' }}>
            {editing === 'profile' && 'Edit Profile'}
            {editing === 'contacts' && 'Emergency Contacts'}
            {editing === 'safeword' && 'Safe Word'}
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          {/* Profile editor */}
          {editing === 'profile' && (
            <>
              <div>
                <div className="label-xs" style={{ marginBottom: '8px' }}>Name</div>
                <input
                  className="sw-input"
                  value={localUser.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Your first name"
                />
              </div>
              <div>
                <div className="label-xs" style={{ marginBottom: '8px' }}>Home Address</div>
                <input
                  className="sw-input"
                  value={localUser.homeAddress || ''}
                  onChange={(e) => updateField('homeAddress', e.target.value)}
                  placeholder="Your home address"
                />
              </div>
            </>
          )}

          {/* Contacts editor */}
          {editing === 'contacts' && (
            <>
              {(localUser.emergencyContacts || []).map((contact, i) => (
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
                          padding: '4px',
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <input
                    className="sw-input"
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
                    value={contact.relationship}
                    onChange={(e) => updateContact(i, 'relationship', e.target.value)}
                    placeholder="Relationship"
                    style={{ padding: '12px 14px' }}
                  />
                </div>
              ))}
              {(localUser.emergencyContacts || []).length < 3 && (
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
                  }}
                >
                  + Add contact
                </button>
              )}
            </>
          )}

          {/* Safe word editor */}
          {editing === 'safeword' && (
            <>
              <div>
                <div className="label-xs" style={{ marginBottom: '8px' }}>Safe Word or Phrase</div>
                <input
                  className="sw-input"
                  value={localUser.safeWord || ''}
                  onChange={(e) => updateField('safeWord', e.target.value)}
                  placeholder="e.g., red balloon, purple elephant"
                />
              </div>
              <div className="hint-box">
                <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                  Say this word naturally during your walk to silently alert your contacts.
                  No alarm, no announcement — Patrona keeps talking as if nothing happened.
                </p>
              </div>
            </>
          )}
        </div>

        <button
          className="btn-primary"
          onClick={handleSave}
          style={{ marginTop: '24px' }}
        >
          {saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>
    );
  }

  // Main settings view
  return (
    <div className="screen" style={{ paddingBottom: '84px' }}>
      {/* Header */}
      <div style={{ padding: '52px 24px 28px' }}>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 300,
            color: 'var(--text)',
            marginBottom: '4px',
            letterSpacing: '-0.01em',
          }}
        >
          Settings
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 400 }}>
          Customize your Patrona experience
        </p>
      </div>

      <div style={{ padding: '0 24px' }}>
        {/* Profile */}
        <Section title="Profile">
          <div className="settings-row" onClick={() => setEditing('profile')}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                {user?.name || 'Your name'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                {user?.homeAddress || 'No home address set'}
              </p>
            </div>
            <span style={{ color: 'var(--text-3)', fontSize: '16px' }}>›</span>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <div
            className="settings-row"
            onClick={toggleTheme}
            style={{ cursor: 'pointer' }}
          >
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                Tap to switch to {theme === 'dark' ? 'light' : 'dark'}
              </p>
            </div>
            <span style={{ fontSize: '18px' }}>{theme === 'dark' ? '☀' : '☽'}</span>
          </div>
        </Section>

        {/* Safety */}
        <Section title="Safety">
          <div className="settings-row" onClick={() => setEditing('contacts')}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                Emergency Contacts
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                {user?.emergencyContacts?.length
                  ? `${user.emergencyContacts.length} contact${user.emergencyContacts.length !== 1 ? 's' : ''} set`
                  : 'None added'}
              </p>
            </div>
            <span style={{ color: 'var(--text-3)', fontSize: '16px' }}>›</span>
          </div>

          <div className="settings-row" onClick={() => setEditing('safeword')}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                Safe Word
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                {user?.safeWord ? '••••••••' : 'Not set'}
              </p>
            </div>
            <span style={{ color: 'var(--text-3)', fontSize: '16px' }}>›</span>
          </div>
        </Section>

        {/* About */}
        <Section title="About">
          <div
            style={{
              padding: '16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span className="font-brand" style={{ fontSize: '18px', color: 'var(--text)' }}>
                patrona
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>v1.0</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.6 }}>
              Your voice companion for getting home safe at night. Powered by ElevenLabs Conversational AI.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
