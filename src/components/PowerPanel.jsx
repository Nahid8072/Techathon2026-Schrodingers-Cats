import React from 'react';

export default function PowerPanel({ totalPower, roomPower }) {
  const totalPowerW = totalPower?.total_power_w ?? 0;
  
  // Radial calculations
  const maxCapacity = 900; // max expected load
  const percentage = Math.min((totalPowerW / maxCapacity) * 100, 100);
  const strokeDasharray = 251.2; // 2 * pi * 40
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  // Let's pair room power with specific colors
  const getRoomColor = (name) => {
    switch (name) {
      case 'Drawing Room': return 'room-val--drawing';
      case 'Work Room 1': return 'room-val--wr1';
      case 'Work Room 2': return 'room-val--wr2';
      default: return '';
    }
  };

  return (
    <div className="power-panel">
      <h3>Total Power Consumption</h3>
      
      <div className="gauge-container">
        <svg viewBox="0 0 100 100" className="radial-gauge">
          <circle cx="50" cy="50" r="40" className="gauge-bg" />
          <circle 
            cx="50" 
            cy="50" 
            r="40" 
            className="gauge-fill" 
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="gauge-overlay">
          <span className="gauge-number">{totalPowerW}<span>W</span></span>
          <span className="gauge-lbl">Total Office Power</span>
          <span className="gauge-badge"><span className="badge-dot"></span>Live</span>
        </div>
      </div>

      <div className="room-breakdown">
        {roomPower.map((rp) => (
          <div key={rp.room_id} className="room-power-card">
            <span className="room-name">{rp.room_name}</span>
            <span className={`room-value ${getRoomColor(rp.room_name)}`}>
              {Math.round(rp.room_power_w)} W
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
