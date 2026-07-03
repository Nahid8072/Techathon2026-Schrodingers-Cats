/**
 * useOfficeLive — React hook that wires your dashboard to the backend.
 *
 * Install in your React project:   npm install socket.io-client
 * Then:
 *   const { devices, roomPower, totalPower, alerts, setDevice } = useOfficeLive();
 *
 * Initial state arrives via REST; every subsequent change is pushed by the
 * server over Socket.IO (fed by Postgres NOTIFY), so nothing polls and the
 * panel updates without a page refresh.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default function useOfficeLive() {
  const [devices, setDevices] = useState([]);       // rows of v_device_live
  const [roomPower, setRoomPower] = useState([]);   // rows of v_room_power
  const [totalPower, setTotalPower] = useState(null);
  const [alerts, setAlerts] = useState([]);         // rows of v_active_alerts
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  const refreshPower = useCallback(async () => {
    const [rooms, total] = await Promise.all([
      fetch(`${API}/api/power/rooms`).then((r) => r.json()),
      fetch(`${API}/api/power/total`).then((r) => r.json()),
    ]);
    setRoomPower(rooms);
    setTotalPower(total);
  }, []);

  useEffect(() => {
    // 1. Initial snapshot over REST
    (async () => {
      const [d, a] = await Promise.all([
        fetch(`${API}/api/devices`).then((r) => r.json()),
        fetch(`${API}/api/alerts`).then((r) => r.json()),
      ]);
      setDevices(d);
      setAlerts(a);
      await refreshPower();
    })();

    // 2. Live updates over WebSocket
    const socket = io(API);
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // A single device flipped: patch it in place, then refresh power meters
    socket.on('device_changed', (ev) => {
      setDevices((prev) =>
        prev.map((d) =>
          d.device_id === ev.device_id
            ? { ...d, status: ev.status, current_power_w: ev.power_w, last_changed: ev.last_changed }
            : d,
        ),
      );
      refreshPower();
    });

    // Alert raised or resolved: refetch the active list (cheap, small table)
    socket.on('alert_changed', async () => {
      const a = await fetch(`${API}/api/alerts`).then((r) => r.json());
      setAlerts(a);
    });

    // Periodic power snapshot from the simulator tick
    socket.on('power_sample', (ev) => {
      setTotalPower((prev) => ({ ...(prev || {}), total_power_w: ev.total_power_w, as_of: ev.as_of }));
    });

    return () => socket.disconnect();
  }, [refreshPower]);

  // Manual on/off control from the dashboard UI
  const setDevice = useCallback(async (deviceId, status) => {
    await fetch(`${API}/api/devices/${deviceId}/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    // No local mutation needed — the device_changed event will arrive via socket
  }, []);

  return { devices, roomPower, totalPower, alerts, connected, setDevice };
}

/* ---------------------------------------------------------------------------
Example consumption (grouped-by-room device panel):

function DevicePanel() {
  const { devices, roomPower, totalPower, alerts, setDevice } = useOfficeLive();
  const rooms = [...new Set(devices.map((d) => d.room_name))];
  return (
    <div>
      <h2>Total draw: {totalPower?.total_power_w ?? '—'} W</h2>
      {rooms.map((room) => (
        <section key={room}>
          <h3>{room} — {roomPower.find((r) => r.room_name === room)?.room_power_w ?? 0} W</h3>
          {devices.filter((d) => d.room_name === room).map((d) => (
            <button key={d.device_id}
                    onClick={() => setDevice(d.device_id, d.status === 'on' ? 'off' : 'on')}>
              {d.device_label}: {d.status.toUpperCase()} ({d.current_power_w} W)
            </button>
          ))}
        </section>
      ))}
      <aside>
        <h3>Active alerts</h3>
        {alerts.map((a) => (
          <p key={a.alert_id}>[{new Date(a.raised_at).toLocaleTimeString()}] {a.message}</p>
        ))}
      </aside>
    </div>
  );
}
--------------------------------------------------------------------------- */
