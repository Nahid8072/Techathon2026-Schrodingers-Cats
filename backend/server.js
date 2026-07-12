/**
 * Smart Office Monitoring — API + real-time bridge
 * -------------------------------------------------
 * Responsibilities:
 *   1. REST API the React dashboard calls for initial state
 *   2. Dedicated pg client that LISTENs on Postgres NOTIFY channels
 *      (device_changed, alert_changed, power_sample) and rebroadcasts
 *      every event to browsers over Socket.IO — no page refresh needed.
 *   3. Simulation loop: calls office.fn_simulate_tick() and
 *      office.fn_check_alerts() on a timer so the data is always "live".
 *
 * Run:  npm install && npm start
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Pool, Client } = require('pg');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4000;
const TICK_MS = Number(process.env.SIM_TICK_MS || 5000);

const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'office_monitor',
  user: process.env.PGUSER || 'office_app',
  password: process.env.PGPASSWORD || 'office_app_pw',
};

const pool = new Pool({ ...dbConfig, max: 10 });
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
});

/* ----------------------------- REST endpoints ---------------------------- */

// Full device panel, grouped client-side by room
app.get('/api/devices', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM office.v_device_live');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Per-room power breakdown
app.get('/api/power/rooms', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM office.v_room_power');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Whole-office total
app.get('/api/power/total', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM office.v_total_power');
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Power history for the trend chart (?minutes=60)
app.get('/api/power/history', async (req, res) => {
  const minutes = Math.min(Number(req.query.minutes || 60), 24 * 60);
  try {
    const { rows } = await pool.query(
      `SELECT sampled_at, total_power_w, room_power
       FROM office.power_samples
       WHERE sampled_at >= now() - ($1 || ' minutes')::interval
       ORDER BY sampled_at`,
      [minutes],
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Active alerts panel
app.get('/api/alerts', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM office.v_active_alerts');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Alert history (?hours=24)
app.get('/api/alerts/history', async (req, res) => {
  const hours = Math.min(Number(req.query.hours || 24), 24 * 7);
  try {
    const { rows } = await pool.query(
      `SELECT a.*, r.room_name, d.device_label
       FROM office.alerts a
       LEFT JOIN office.devices d USING (device_id)
       LEFT JOIN office.rooms r ON r.room_id = COALESCE(a.room_id, d.room_id)
       WHERE a.raised_at >= now() - ($1 || ' hours')::interval
       ORDER BY a.raised_at DESC`,
      [hours],
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Manual override from the dashboard: { "status": "on" | "off" }
app.post('/api/devices/:id/set', async (req, res) => {
  const { status } = req.body;
  if (!['on', 'off'].includes(status)) {
    return res.status(400).json({ error: "status must be 'on' or 'off'" });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM office.fn_set_device($1, $2)',
      [req.params.id, status],
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get app settings
app.get('/api/settings', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM office.app_settings WHERE id = 1');
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update app settings
app.post('/api/settings', async (req, res) => {
  const { office_timezone, office_open, office_close, continuous_on_limit } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO office.app_settings (id, office_timezone, office_open, office_close, continuous_on_limit, updated_at)
       VALUES (1, $1, $2, $3, $4, now())
       ON CONFLICT (id) DO UPDATE
       SET office_timezone = EXCLUDED.office_timezone,
           office_open = EXCLUDED.office_open,
           office_close = EXCLUDED.office_close,
           continuous_on_limit = EXCLUDED.continuous_on_limit,
           updated_at = now()
       RETURNING *`,
      [office_timezone, office_open, office_close, continuous_on_limit]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date() }));

/* --------------- Postgres LISTEN/NOTIFY → Socket.IO bridge --------------- */

async function startListener() {
  const listener = new Client(dbConfig); // dedicated connection, never pooled
  await listener.connect();
  await listener.query('LISTEN device_changed');
  await listener.query('LISTEN alert_changed');
  await listener.query('LISTEN power_sample');

  listener.on('notification', (msg) => {
    try {
      io.emit(msg.channel, JSON.parse(msg.payload)); // channel name == event name
    } catch {
      io.emit(msg.channel, msg.payload);
    }
  });

  listener.on('error', (err) => {
    console.error('LISTEN connection lost, reconnecting in 3 s:', err.message);
    setTimeout(startListener, 3000);
  });

  console.log('LISTENing on device_changed / alert_changed / power_sample');
}

/* ------------------------------ Simulator -------------------------------- */

async function simulationTick() {
  try {
    const toggled = await pool.query('SELECT office.fn_simulate_tick() AS n');
    const alerts = await pool.query('SELECT * FROM office.fn_check_alerts()');
    const { raised, resolved } = alerts.rows[0];
    if (toggled.rows[0].n || raised || resolved) {
      console.log(
        `[tick] toggled=${toggled.rows[0].n} alerts raised=${raised} resolved=${resolved}`,
      );
    }
  } catch (e) {
    console.error('[tick] failed:', e.message);
  }
}

/* -------------------------------- Startup -------------------------------- */

server.listen(PORT, async () => {
  console.log(`API + WebSocket server on http://localhost:${PORT}`);
  await startListener();
  if (process.env.SIMULATOR !== 'off') {
    setInterval(simulationTick, TICK_MS);
    console.log(`Simulator running every ${TICK_MS} ms (set SIMULATOR=off to disable)`);
  }
  // prune old power samples hourly
  setInterval(() => pool.query('SELECT office.fn_prune_history()').catch(() => {}), 3600_000);
});
