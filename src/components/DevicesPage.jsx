import React from 'react';

export default function DevicesPage({ devices, onToggle }) {
  const getDeviceBadge = (status) => {
    return (
      <span className={`status-badge ${status === 'on' ? 'status-badge--on' : 'status-badge--off'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="sub-page">
      <div className="page-header">
        <h2>Device Inventory ({devices.length} Devices)</h2>
        <p>Monitor live state, device types, rated power draw, and override values directly.</p>
      </div>

      <div className="devices-table-container">
        <table className="devices-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Device Label</th>
              <th>Type</th>
              <th>Rated Power</th>
              <th>Current Power</th>
              <th>State</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.device_id}>
                <td className="font-semibold">{d.room_name}</td>
                <td>{d.device_label}</td>
                <td>
                  <span className="type-tag">
                    {d.device_type === 'fan' ? '🌀 Fan' : '💡 Light'}
                  </span>
                </td>
                <td>{d.rated_power_w} W</td>
                <td className={d.status === 'on' ? 'text-power' : ''}>
                  {d.status === 'on' ? `${d.rated_power_w} W` : '0 W'}
                </td>
                <td>{getDeviceBadge(d.status)}</td>
                <td>
                  <button
                    className={`btn-toggle ${d.status === 'on' ? 'btn-toggle--active' : ''}`}
                    onClick={() => onToggle(d.device_id, d.status === 'on' ? 'off' : 'on')}
                  >
                    Toggle {d.status === 'on' ? 'Off' : 'On'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
