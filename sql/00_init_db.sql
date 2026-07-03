-- ============================================================================
-- Run once as the postgres superuser:  psql -U postgres -f sql/00_init_db.sql
-- Creates the application role and database. Change the password before
-- deploying anywhere non-local.
-- ============================================================================

CREATE ROLE office_app WITH LOGIN PASSWORD 'office_app_pw';
CREATE DATABASE office_monitor OWNER office_app;

\connect office_monitor
GRANT ALL ON DATABASE office_monitor TO office_app;
