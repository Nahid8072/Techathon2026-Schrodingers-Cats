import React from 'react';

function Fan({ status, onClick }) {
  return (
    <div className={`fan-unit ${status === 'on' ? 'fan-unit--on' : ''}`} onClick={onClick}>
      <div className="fan-blades">
        <div className="blade"></div>
        <div className="blade"></div>
        <div className="blade"></div>
      </div>
      <div className="fan-center"></div>
    </div>
  );
}

function Light({ status, onClick }) {
  return (
    <div className={`light-unit ${status === 'on' ? 'light-unit--on' : ''}`} onClick={onClick}>
      <div className="light-glow"></div>
      <div className="light-bulb"></div>
    </div>
  );
}

export default function FloorPlan({ devices, onToggle }) {
  // Group devices by room
  const rooms = {
    'Drawing Room': devices.filter(d => d.room_name === 'Drawing Room'),
    'Work Room 1': devices.filter(d => d.room_name === 'Work Room 1'),
    'Work Room 2': devices.filter(d => d.room_name === 'Work Room 2'),
  };

  const getDeviceIcon = (d) => {
    const toggle = () => onToggle(d.device_id, d.status === 'on' ? 'off' : 'on');
    if (d.device_type === 'fan') {
      return <Fan key={d.device_id} status={d.status} onClick={toggle} />;
    } else {
      return <Light key={d.device_id} status={d.status} onClick={toggle} />;
    }
  };

  // For the visual mock elements matching the user's uploaded landing page:
  // Drawing room has a sofa representation, fans, lights, tables
  // Work Room 1 and 2 have desks, chairs, fans, lights

  return (
    <div className="floor-plan-container">
      <div className="floor-plan-grid">
        {/* Drawing Room */}
        <div className="floor-plan-room drawing-room">
          <div className="furniture sofa-main"></div>
          <div className="furniture table-center"></div>
          <div className="furniture arm-chair"></div>
          
          {/* Devices positioned as in image */}
          <div className="device-position pos-fan-1">
            {rooms['Drawing Room'].filter(d => d.device_label === 'Fan 1').map(getDeviceIcon)}
          </div>
          <div className="device-position pos-fan-2">
            {rooms['Drawing Room'].filter(d => d.device_label === 'Fan 2').map(getDeviceIcon)}
          </div>
          <div className="device-position pos-light-1">
            {rooms['Drawing Room'].filter(d => d.device_label === 'Light 1').map(getDeviceIcon)}
          </div>
          <div className="device-position pos-light-2">
            {rooms['Drawing Room'].filter(d => d.device_label === 'Light 2').map(getDeviceIcon)}
          </div>
          <div className="device-position pos-light-3">
            {rooms['Drawing Room'].filter(d => d.device_label === 'Light 3').map(getDeviceIcon)}
          </div>

          <div className="room-title">Drawing Room</div>
        </div>

        {/* Work Room 1 */}
        <div className="floor-plan-room work-room-1">
          {/* Desks and chairs */}
          <div className="furniture desk desk-1"></div>
          <div className="furniture desk desk-2"></div>
          <div className="furniture desk desk-3"></div>
          <div className="furniture desk desk-4"></div>

          <div className="device-position pos-wr1-fan-1">
            {rooms['Work Room 1'].filter(d => d.device_label === 'Fan 1').map(getDeviceIcon)}
          </div>
          <div className="device-position pos-wr1-fan-2">
            {rooms['Work Room 1'].filter(d => d.device_label === 'Fan 2').map(getDeviceIcon)}
          </div>
          <div className="device-position pos-wr1-light-1">
            {rooms['Work Room 1'].filter(d => d.device_label === 'Light 1').map(getDeviceIcon)}
          </div>
          <div className="device-position pos-wr1-light-2">
            {rooms['Work Room 1'].filter(d => d.device_label === 'Light 2').map(getDeviceIcon)}
          </div>
          <div className="device-position pos-wr1-light-3">
            {rooms['Work Room 1'].filter(d => d.device_label === 'Light 3').map(getDeviceIcon)}
          </div>

          <div className="room-title">Work Room 1</div>
        </div>

        {/* Work Room 2 */}
        <div className="floor-plan-room work-room-2">
          {/* Desks and chairs */}
          <div className="furniture desk desk-1"></div>
          <div className="furniture desk desk-2"></div>
          <div className="furniture desk desk-3"></div>
          <div className="furniture desk desk-4"></div>

          <div className="device-position pos-wr2-fan-1">
            {rooms['Work Room 2'].filter(d => d.device_label === 'Fan 1').map(getDeviceIcon)}
          </div>
          <div className="device-position pos-wr2-fan-2">
            {rooms['Work Room 2'].filter(d => d.device_label === 'Fan 2').map(getDeviceIcon)}
          </div>
          <div className="device-position pos-wr2-light-1">
            {rooms['Work Room 2'].filter(d => d.device_label === 'Light 1').map(getDeviceIcon)}
          </div>
          <div className="device-position pos-wr2-light-2">
            {rooms['Work Room 2'].filter(d => d.device_label === 'Light 2').map(getDeviceIcon)}
          </div>
          <div className="device-position pos-wr2-light-3">
            {rooms['Work Room 2'].filter(d => d.device_label === 'Light 3').map(getDeviceIcon)}
          </div>

          <div className="room-title">Work Room 2</div>
        </div>
      </div>
    </div>
  );
}
