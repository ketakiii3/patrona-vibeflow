export default function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'home',     symbol: '⌂', label: 'Home' },
    { id: 'history',  symbol: '≡', label: 'History' },
    { id: 'settings', symbol: '◎', label: 'Settings' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`nav-item ${activeTab === t.id ? 'active' : ''}`}
          onClick={() => onTabChange(t.id)}
        >
          <span
            className="nav-icon"
            style={{
              fontSize: '17px',
              lineHeight: 1,
            }}
          >
            {t.symbol}
          </span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
