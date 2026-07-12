import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function AlertsPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/alerts/history?hours=24`)
      .then((r) => r.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatTime = (timeString) => {
    if (!timeString) return '—';
    try {
      const date = new Date(timeString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="sub-page">
      <div className="page-header">
        <h2>System Anomaly & Alert Log</h2>
        <p>Review the full record of active and resolved warnings for energy usage anomalies over the past 24 hours.</p>
      </div>

      <div className="history-table-container">
        <h3>Alert Audit Trail</h3>
        {loading ? (
          <p>Loading alert logs...</p>
        ) : history.length === 0 ? (
          <p>No alerts recorded in the past 24 hours.</p>
        ) : (
          <table className="devices-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Room / Device</th>
                <th>Anomaly Message</th>
                <th>Raised At</th>
                <th>Resolved At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((alert) => {
                const isActive = alert.state === 'active';
                const isAfterHours = alert.alert_type === 'after_hours_on';
                
                return (
                  <tr key={alert.alert_id}>
                    <td>
                      <span className={`alert-indicator-dot ${isAfterHours ? 'alert-dot--orange' : 'alert-dot--red'}`}></span>
                      {isAfterHours ? 'Warning' : 'Critical'}
                    </td>
                    <td className="font-semibold">
                      {alert.room_name} {alert.device_label ? `— ${alert.device_label}` : ''}
                    </td>
                    <td className="desc-text">{alert.message}</td>
                    <td>{formatTime(alert.raised_at)}</td>
                    <td>{formatTime(alert.resolved_at)}</td>
                    <td>
                      <span className={`status-badge ${isActive ? 'status-badge--off' : 'status-badge--on'}`}>
                        {isActive ? 'ACTIVE' : 'RESOLVED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
