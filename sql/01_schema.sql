-- ============================================================================
-- Smart Office Monitoring System — PostgreSQL Schema
-- Target: PostgreSQL 13+ (validated on 16)
-- Purpose: Backing store for a real-time office device dashboard (React front
--          end). Covers device state, state-change history, power sampling
--          for time-series charts, and anomaly alerts.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Dedicated schema (keeps the app isolated from `public`)
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS office;
SET search_path TO office, public;

-- ----------------------------------------------------------------------------
-- 1. Enumerated types
-- ----------------------------------------------------------------------------
CREATE TYPE office.device_type   AS ENUM ('fan', 'light');
CREATE TYPE office.device_status AS ENUM ('on', 'off');
CREATE TYPE office.room_kind     AS ENUM ('waiting_area', 'work_room');
CREATE TYPE office.alert_type    AS ENUM ('after_hours_on', 'room_continuous_on_2h');
CREATE TYPE office.alert_state   AS ENUM ('active', 'resolved');

-- ----------------------------------------------------------------------------
-- 2. Configuration (office hours, timezone, alert thresholds)
--    Single-row table; the CHECK on id enforces exactly one row.
-- ----------------------------------------------------------------------------
CREATE TABLE office.app_settings (
    id                  smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    office_timezone     text        NOT NULL DEFAULT 'Asia/Dhaka',
    office_open         time        NOT NULL DEFAULT '09:00',
    office_close        time        NOT NULL DEFAULT '17:00',
    continuous_on_limit interval    NOT NULL DEFAULT interval '2 hours',
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. Rooms
-- ----------------------------------------------------------------------------
CREATE TABLE office.rooms (
    room_id    smallserial PRIMARY KEY,
    room_name  text        NOT NULL UNIQUE,
    room_kind  office.room_kind NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. Devices — the live state table the dashboard reads from
--    `last_changed` is maintained automatically by trigger (Section 7).
-- ----------------------------------------------------------------------------
CREATE TABLE office.devices (
    device_id     serial PRIMARY KEY,
    room_id       smallint NOT NULL REFERENCES office.rooms(room_id) ON DELETE CASCADE,
    device_type   office.device_type NOT NULL,
    device_label  text     NOT NULL,                 -- e.g. 'Fan 1', 'Light 3'
    rated_power_w numeric(7,2) NOT NULL CHECK (rated_power_w > 0),
    status        office.device_status NOT NULL DEFAULT 'off',
    last_changed  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (room_id, device_label)                   -- 'Fan 1' unique per room
);

CREATE INDEX idx_devices_room   ON office.devices(room_id);
CREATE INDEX idx_devices_status ON office.devices(status);

-- ----------------------------------------------------------------------------
-- 5. Device event log — immutable history of every state change
--    Feeds "last changed" audit, alert logic, and any future analytics.
-- ----------------------------------------------------------------------------
CREATE TABLE office.device_events (
    event_id   bigserial PRIMARY KEY,
    device_id  int NOT NULL REFERENCES office.devices(device_id) ON DELETE CASCADE,
    old_status office.device_status,
    new_status office.device_status NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_device_time ON office.device_events(device_id, changed_at DESC);

-- ----------------------------------------------------------------------------
-- 6. Power samples — periodic snapshot of total + per-room draw (Watts)
--    Written by the simulator each tick; drives the live meter history chart.
-- ----------------------------------------------------------------------------
CREATE TABLE office.power_samples (
    sample_id     bigserial PRIMARY KEY,
    sampled_at    timestamptz NOT NULL DEFAULT now(),
    total_power_w numeric(9,2) NOT NULL,
    room_power    jsonb        NOT NULL   -- e.g. {"Work Room 1": 165.0, ...}
);

CREATE INDEX idx_power_samples_time ON office.power_samples(sampled_at DESC);

-- ----------------------------------------------------------------------------
-- 7. Alerts
--    Partial unique indexes prevent duplicate ACTIVE alerts for the same
--    device/room while still allowing a full resolved history.
-- ----------------------------------------------------------------------------
CREATE TABLE office.alerts (
    alert_id    bigserial PRIMARY KEY,
    alert_type  office.alert_type NOT NULL,
    device_id   int      REFERENCES office.devices(device_id) ON DELETE CASCADE,
    room_id     smallint REFERENCES office.rooms(room_id)     ON DELETE CASCADE,
    message     text        NOT NULL,
    state       office.alert_state NOT NULL DEFAULT 'active',
    raised_at   timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz,
    CHECK (device_id IS NOT NULL OR room_id IS NOT NULL),
    CHECK ((state = 'resolved') = (resolved_at IS NOT NULL))
);

CREATE UNIQUE INDEX uq_active_device_alert
    ON office.alerts(alert_type, device_id) WHERE state = 'active' AND device_id IS NOT NULL;
CREATE UNIQUE INDEX uq_active_room_alert
    ON office.alerts(alert_type, room_id)   WHERE state = 'active' AND device_id IS NULL;
CREATE INDEX idx_alerts_state_time ON office.alerts(state, raised_at DESC);

-- ----------------------------------------------------------------------------
-- 8. Trigger: on any device status change
--      a) stamp last_changed
--      b) append to device_events
--      c) pg_notify('device_changed', payload) → backend pushes over WebSocket
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION office.trg_device_status_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.last_changed := now();

        INSERT INTO office.device_events(device_id, old_status, new_status, changed_at)
        VALUES (NEW.device_id, OLD.status, NEW.status, NEW.last_changed);

        PERFORM pg_notify(
            'device_changed',
            json_build_object(
                'device_id',    NEW.device_id,
                'room_id',      NEW.room_id,
                'device_label', NEW.device_label,
                'device_type',  NEW.device_type,
                'status',       NEW.status,
                'power_w',      CASE WHEN NEW.status = 'on' THEN NEW.rated_power_w ELSE 0 END,
                'last_changed', NEW.last_changed
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER device_status_change
    BEFORE UPDATE OF status ON office.devices
    FOR EACH ROW EXECUTE FUNCTION office.trg_device_status_change();

-- ----------------------------------------------------------------------------
-- 9. Trigger: notify when an alert is raised or resolved
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION office.trg_alert_notify()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_notify(
        'alert_changed',
        json_build_object(
            'alert_id',   NEW.alert_id,
            'alert_type', NEW.alert_type,
            'device_id',  NEW.device_id,
            'room_id',    NEW.room_id,
            'message',    NEW.message,
            'state',      NEW.state,
            'raised_at',  NEW.raised_at,
            'resolved_at',NEW.resolved_at
        )::text
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER alert_notify
    AFTER INSERT OR UPDATE ON office.alerts
    FOR EACH ROW EXECUTE FUNCTION office.trg_alert_notify();

-- ----------------------------------------------------------------------------
-- 10. Views the React dashboard consumes
-- ----------------------------------------------------------------------------

-- 10a. Live device panel (one row per device, grouped by room in the UI)
CREATE VIEW office.v_device_live AS
SELECT d.device_id,
       r.room_id,
       r.room_name,
       r.room_kind,
       d.device_type,
       d.device_label,
       d.status,
       d.rated_power_w,
       CASE WHEN d.status = 'on' THEN d.rated_power_w ELSE 0 END AS current_power_w,
       d.last_changed,
       now() - d.last_changed AS in_state_for
FROM office.devices d
JOIN office.rooms r USING (room_id)
ORDER BY r.room_id, d.device_type, d.device_label;

-- 10b. Per-room live power breakdown
CREATE VIEW office.v_room_power AS
SELECT r.room_id,
       r.room_name,
       COUNT(*) FILTER (WHERE d.status = 'on')                                   AS devices_on,
       COUNT(*)                                                                  AS devices_total,
       COALESCE(SUM(d.rated_power_w) FILTER (WHERE d.status = 'on'), 0)::numeric(9,2) AS room_power_w
FROM office.rooms r
LEFT JOIN office.devices d USING (room_id)
GROUP BY r.room_id, r.room_name
ORDER BY r.room_id;

-- 10c. Whole-office live total
CREATE VIEW office.v_total_power AS
SELECT COALESCE(SUM(rated_power_w) FILTER (WHERE status = 'on'), 0)::numeric(9,2) AS total_power_w,
       COUNT(*) FILTER (WHERE status = 'on')  AS devices_on,
       COUNT(*)                               AS devices_total,
       now()                                  AS as_of
FROM office.devices;

-- 10d. Active alerts panel
CREATE VIEW office.v_active_alerts AS
SELECT a.alert_id,
       a.alert_type,
       a.message,
       a.raised_at,
       d.device_label,
       r.room_name
FROM office.alerts a
LEFT JOIN office.devices d ON d.device_id = a.device_id
LEFT JOIN office.rooms   r ON r.room_id  = COALESCE(a.room_id, d.room_id)
WHERE a.state = 'active'
ORDER BY a.raised_at DESC;

COMMIT;
