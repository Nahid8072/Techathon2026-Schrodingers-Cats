import React from 'react';

export default function AlertsPanel({ alerts }) {
  // Let's parse or format alerts beautifully
  const formatTime = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="alerts-panel">
      <div className="alerts-header">
        <h3>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-header-icon">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Active Alerts
        </h3>
        {alerts.length > 0 && <span className="alert-badge-count">{alerts.length}</span>}
      </div>

      <div className="alerts-list">
        {alerts.map((alert) => {
          // Highlight different types of alerts
          const isAfterHours = alert.alert_type === 'after_hours_on';
          const isContinuous = alert.alert_type === 'room_continuous_on_2h';
          
          return (
            <div key={alert.alert_id} className="alert-item">
              <div className="alert-indicator-column">
                <span className={`alert-dot ${isAfterHours ? 'alert-dot--orange' : 'alert-dot--red'}`}></span>
              </div>
              <div className="alert-details">
                <div className="alert-title">
                  {alert.room_name} — {alert.device_label ? `${alert.device_label} ON` : 'All Devices ON'}
                </div>
                <div className="alert-desc">
                  {isAfterHours && "Device is ON outside office hours (9 AM–5 PM)"}
                  {isContinuous && "All devices ON for 2.2h"}
                  {!isAfterHours && !isContinuous && alert.message}
                </div>
              </div>
              <div className="alert-timestamp">
                {formatTime(alert.raised_at)}
              </div>
            </div>
          );
        })}
        {alerts.length === 0 && (
          <div className="no-alerts">
            <p>No active alerts. All systems running optimally.</p>
          </div>
        )}
      </div>
    </div>
  );
}
