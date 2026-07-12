import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function AnalyticsPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/power/history?minutes=30`)
      .then((r) => r.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatSampleTime = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  // Find max and average load
  const powerValues = history.map(h => Number(h.total_power_w));
  const avgPower = powerValues.length > 0 ? Math.round(powerValues.reduce((a, b) => a + b, 0) / powerValues.length) : 0;
  const maxPower = powerValues.length > 0 ? Math.max(...powerValues) : 0;

  return (
    <div className="sub-page">
      <div className="page-header">
        <h2>Power Usage Analytics</h2>
        <p>Review real-time PostgreSQL simulated timeline samples of office power consumption.</p>
      </div>

      <div className="analytics-summary-cards">
        <div className="summary-metric-card">
          <h4>Average Power Load</h4>
          <p className="metric-val">{avgPower} W</p>
          <span>Past 30 minutes</span>
        </div>
        <div className="summary-metric-card">
          <h4>Max Peak Load</h4>
          <p className="metric-val text-red">{maxPower} W</p>
          <span>Highest recorded peak</span>
        </div>
        <div className="summary-metric-card">
          <h4>Samples Recorded</h4>
          <p className="metric-val text-purple">{history.length}</p>
          <span>Ticks sampled by simulator</span>
        </div>
      </div>

      <div className="history-table-container">
        <h3>Power Load Timeline (Recent samples)</h3>
        {loading ? (
          <p>Loading analytics data...</p>
        ) : history.length === 0 ? (
          <p>No timeline samples recorded yet. Ensure simulator ticks are enabled.</p>
        ) : (
          <table className="devices-table">
            <thead>
              <tr>
                <th>Sample ID / Time</th>
                <th>Total Power</th>
                <th>Drawing Room</th>
                <th>Work Room 1</th>
                <th>Work Room 2</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(-15).reverse().map((sample, idx) => (
                <tr key={idx}>
                  <td className="font-semibold">{formatSampleTime(sample.sampled_at)}</td>
                  <td className="text-power">{Math.round(sample.total_power_w)} W</td>
                  <td>{Math.round(sample.room_power['Drawing Room'] || 0)} W</td>
                  <td>{Math.round(sample.room_power['Work Room 1'] || 0)} W</td>
                  <td>{Math.round(sample.room_power['Work Room 2'] || 0)} W</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
