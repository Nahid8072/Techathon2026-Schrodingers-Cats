import React, { useState, useEffect } from 'react';

export default function Header({ connected, lastUpdated }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateStr = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const lastUpdatedStr = lastUpdated
    ? `Data last updated ${new Date(lastUpdated).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })}`
    : 'Connecting…';

  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <div className="header__brand-text">
          <h1>Kernel</h1>
          <p>Smart Office · Monitoring System</p>
        </div>
      </div>

      <div className="header__center">
        <div className="header__live-badge">
          <span className="header__live-dot"></span>
          LIVE
        </div>
        <span className="header__last-updated">{lastUpdatedStr}</span>
      </div>

      <div className="header__right">
        <div className="header__clock">
          <div className="header__clock-time">{timeStr}</div>
          <div className="header__clock-date">{dateStr}</div>
        </div>

        <div className="header__profile">
          <div className="header__avatar">A</div>
          <div className="header__profile-info">
            <div className="header__profile-name">Admin</div>
            <div className="header__profile-email">admin@kernel.io</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </div>
      </div>
    </header>
  );
}
