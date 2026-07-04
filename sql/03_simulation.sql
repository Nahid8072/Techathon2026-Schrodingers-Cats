-- ============================================================================
-- Simulation engine + alert detection (all in-database, called by the
-- Node.js worker on a timer, or manually from psql for testing)
-- ============================================================================

BEGIN;
SET search_path TO office, public;

-- ----------------------------------------------------------------------------
-- 1. fn_simulate_tick(p_toggle_prob)
--    Randomly toggles each device with probability p_toggle_prob (default 15%),
--    then records a power sample. Devices are slightly biased toward being ON
--    during office hours and OFF outside them, which produces both realistic
--    behaviour and organic after-hours anomalies for the alert panel.
--    Returns the number of devices toggled this tick.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION office.fn_simulate_tick(p_toggle_prob numeric DEFAULT 0.15)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE
    v_settings office.app_settings%ROWTYPE;
    v_local_time time;
    v_in_hours boolean;
    v_toggled int;
BEGIN
    SELECT * INTO v_settings FROM office.app_settings WHERE id = 1;
    v_local_time := (now() AT TIME ZONE v_settings.office_timezone)::time;
    v_in_hours   := v_local_time >= v_settings.office_open
                AND v_local_time <  v_settings.office_close;

    WITH flips AS (
        UPDATE office.devices d
        SET status = CASE WHEN d.status = 'on' THEN 'off' ELSE 'on' END::office.device_status
        WHERE random() < p_toggle_prob
              -- bias: during office hours OFF devices are likelier to flip ON;
              -- after hours ON devices are likelier to flip OFF
              * CASE
                    WHEN v_in_hours     AND d.status = 'off' THEN 1.5
                    WHEN NOT v_in_hours AND d.status = 'on'  THEN 1.5
                    ELSE 0.7
                END
        RETURNING 1
    )
    SELECT count(*) INTO v_toggled FROM flips;

    -- Record a power snapshot for the live meter / history chart
    INSERT INTO office.power_samples (total_power_w, room_power)
    SELECT (SELECT total_power_w FROM office.v_total_power),
           COALESCE(jsonb_object_agg(room_name, room_power_w), '{}'::jsonb)
    FROM office.v_room_power;

    PERFORM pg_notify('power_sample', (
        SELECT json_build_object(
                   'total_power_w', total_power_w,
                   'as_of', as_of
               )::text
        FROM office.v_total_power
    ));

    RETURN v_toggled;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. fn_check_alerts()
--    Evaluates both anomaly rules and both raises and auto-resolves alerts.
--    Rule A (after_hours_on): any device ON outside configured office hours.
--    Rule B (room_continuous_on_2h): every device in a room ON, and the most
--           recent state change among them is older than the configured limit
--           (i.e. the whole room has been fully ON continuously for >= 2 h).
--    Returns (raised, resolved) counts.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION office.fn_check_alerts(OUT raised int, OUT resolved int)
LANGUAGE plpgsql AS $$
DECLARE
    v_settings office.app_settings%ROWTYPE;
    v_local_time time;
    v_after_hours boolean;
BEGIN
    raised := 0; resolved := 0;
    SELECT * INTO v_settings FROM office.app_settings WHERE id = 1;
    v_local_time  := (now() AT TIME ZONE v_settings.office_timezone)::time;
    v_after_hours := v_local_time < v_settings.office_open
                  OR v_local_time >= v_settings.office_close;

    ---------------------------------------------------------------- Rule A
    IF v_after_hours THEN
        WITH ins AS (
            INSERT INTO office.alerts (alert_type, device_id, room_id, message)
            SELECT 'after_hours_on', d.device_id, d.room_id,
                   format('%s in %s left ON after office hours (since %s)',
                          d.device_label, r.room_name,
                          to_char(d.last_changed AT TIME ZONE v_settings.office_timezone,
                                  'YYYY-MM-DD HH24:MI'))
            FROM office.devices d
            JOIN office.rooms r USING (room_id)
            WHERE d.status = 'on'
            ON CONFLICT (alert_type, device_id) WHERE state = 'active' AND device_id IS NOT NULL
            DO NOTHING
            RETURNING 1
        )
        SELECT raised + count(*) INTO raised FROM ins;
    END IF;

    -- Resolve Rule A alerts whose device turned OFF (or when back in hours)
    WITH res AS (
        UPDATE office.alerts a
        SET state = 'resolved', resolved_at = now()
        WHERE a.alert_type = 'after_hours_on' AND a.state = 'active'
          AND ( NOT v_after_hours
                OR EXISTS (SELECT 1 FROM office.devices d
                           WHERE d.device_id = a.device_id AND d.status = 'off') )
        RETURNING 1
    )
    SELECT resolved + count(*) INTO resolved FROM res;

    ---------------------------------------------------------------- Rule B
    WITH room_state AS (
        SELECT d.room_id,
               bool_and(d.status = 'on') AS all_on,
               max(d.last_changed)       AS newest_change
        FROM office.devices d
        GROUP BY d.room_id
    ), ins AS (
        INSERT INTO office.alerts (alert_type, room_id, message)
        SELECT 'room_continuous_on_2h', rs.room_id,
               format('All devices in %s have been ON continuously for over %s (since %s)',
                      r.room_name, v_settings.continuous_on_limit,
                      to_char(rs.newest_change AT TIME ZONE v_settings.office_timezone,
                              'YYYY-MM-DD HH24:MI'))
        FROM room_state rs
        JOIN office.rooms r USING (room_id)
        WHERE rs.all_on
          AND rs.newest_change <= now() - v_settings.continuous_on_limit
        ON CONFLICT (alert_type, room_id) WHERE state = 'active' AND device_id IS NULL
        DO NOTHING
        RETURNING 1
    )
    SELECT raised + count(*) INTO raised FROM ins;

    -- Resolve Rule B alerts once any device in the room turns OFF
    WITH room_state AS (
        SELECT room_id, bool_and(status = 'on') AS all_on
        FROM office.devices GROUP BY room_id
    ), res AS (
        UPDATE office.alerts a
        SET state = 'resolved', resolved_at = now()
        FROM room_state rs
        WHERE a.alert_type = 'room_continuous_on_2h' AND a.state = 'active'
          AND a.room_id = rs.room_id AND NOT rs.all_on
        RETURNING 1
    )
    SELECT resolved + count(*) INTO resolved FROM res;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. fn_set_device(p_device_id, p_status) — manual control endpoint used by
--    the React UI toggle buttons (and useful in testing).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION office.fn_set_device(p_device_id int, p_status office.device_status)
RETURNS office.v_device_live LANGUAGE plpgsql AS $$
DECLARE
    v_row office.v_device_live%ROWTYPE;
BEGIN
    UPDATE office.devices SET status = p_status WHERE device_id = p_device_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Device % does not exist', p_device_id;
    END IF;
    SELECT * INTO v_row FROM office.v_device_live WHERE device_id = p_device_id;
    RETURN v_row;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Housekeeping: keep only the last 7 days of power samples
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION office.fn_prune_history()
RETURNS void LANGUAGE sql AS $$
    DELETE FROM office.power_samples WHERE sampled_at < now() - interval '7 days';
$$;

COMMIT;
