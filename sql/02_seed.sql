-- ============================================================================
-- Seed data — rooms, devices, settings
--
-- NOTE ON DEVICE COUNT: the requirement document is internally inconsistent.
-- It specifies "2 fans and 3 lights (5 devices per room, 15 total)" but later
-- refers twice to "all 18 devices". This seed follows the explicit per-room
-- composition (2 fans + 3 lights = 15 devices). To obtain 18 devices instead
-- (3 fans + 3 lights per room), change FANS_PER_ROOM from 2 to 3 below.
-- ============================================================================

BEGIN;
SET search_path TO office, public;

INSERT INTO office.app_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO office.rooms (room_name, room_kind) VALUES
    ('Drawing Room', 'waiting_area'),
    ('Work Room 1',  'work_room'),
    ('Work Room 2',  'work_room');

-- Generate devices for every room:
--   fans   : 'Fan 1'..'Fan N'   rated 60 W
--   lights : 'Light 1'..'Light 3' rated 15 W
DO $$
DECLARE
    FANS_PER_ROOM   constant int := 2;   -- set to 3 for the 18-device variant
    LIGHTS_PER_ROOM constant int := 3;
    r record;
    i int;
BEGIN
    FOR r IN SELECT room_id FROM office.rooms ORDER BY room_id LOOP
        FOR i IN 1..FANS_PER_ROOM LOOP
            INSERT INTO office.devices (room_id, device_type, device_label, rated_power_w, status)
            VALUES (r.room_id, 'fan', 'Fan ' || i, 60.00,
                    CASE WHEN random() < 0.5 THEN 'on' ELSE 'off' END::office.device_status);
        END LOOP;
        FOR i IN 1..LIGHTS_PER_ROOM LOOP
            INSERT INTO office.devices (room_id, device_type, device_label, rated_power_w, status)
            VALUES (r.room_id, 'light', 'Light ' || i, 15.00,
                    CASE WHEN random() < 0.6 THEN 'on' ELSE 'off' END::office.device_status);
        END LOOP;
    END LOOP;
END $$;

-- Backfill an initial event per device so the event log is never empty
INSERT INTO office.device_events (device_id, old_status, new_status, changed_at)
SELECT device_id, NULL, status, last_changed FROM office.devices;

COMMIT;
