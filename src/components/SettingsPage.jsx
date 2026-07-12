import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function SettingsPage() {
  const [timezone, setTimezone] = useState('Asia/Dhaka');
  const [officeOpen, setOfficeOpen] = useState('09:00');
  const [officeClose, setOfficeClose] = useState('17:00');
  const [limit, setLimit] = useState('2 hours');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setTimezone(data.office_timezone);
          setOfficeOpen(data.office_open.substring(0, 5)); // truncate seconds
          setOfficeClose(data.office_close.substring(0, 5));
          setLimit(data.continuous_on_limit.hours ? `${data.continuous_on_limit.hours} hours` : '2 hours');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    fetch(`${API}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        office_timezone: timezone,
        office_open: officeOpen,
        office_close: officeClose,
        continuous_on_limit: limit,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setSaving(false);
        setMessage({ type: 'success', text: 'Settings saved to database successfully!' });
      })
      .catch(() => {
        setSaving(false);
        setMessage({ type: 'error', text: 'Failed to save settings.' });
      });
  };

  return (
    <div className="sub-page">
      <div className="page-header">
        <h2>App & Simulator Settings</h2>
        <p>Configure office timings, timezone parameters, and threshold limits. Updates affect simulator trigger logic instantly.</p>
      </div>

      {loading ? (
        <p>Loading application settings...</p>
      ) : (
        <form onSubmit={handleSave} className="settings-form">
          <div className="form-group">
            <label htmlFor="timezone">Office Timezone</label>
            <input
              type="text"
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="officeOpen">Office Hours Open</label>
              <input
                type="time"
                id="officeOpen"
                value={officeOpen}
                onChange={(e) => setOfficeOpen(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="officeClose">Office Hours Close</label>
              <input
                type="time"
                id="officeClose"
                value={officeClose}
                onChange={(e) => setOfficeClose(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="limit">Continuous ON Alert Limit</label>
            <select id="limit" value={limit} onChange={(e) => setLimit(e.target.value)}>
              <option value="1 hour">1 hour</option>
              <option value="2 hours">2 hours</option>
              <option value="3 hours">3 hours</option>
              <option value="4 hours">4 hours</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {message && (
            <div className={`form-message form-message--${message.type}`}>
              {message.text}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
