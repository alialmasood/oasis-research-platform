-- Script to set up database permissions for research_app user
-- Run this script after the database is created

-- Ensure research_app owns the public schema
ALTER SCHEMA public OWNER TO research_app;

-- Grant default privileges on schema
GRANT ALL ON SCHEMA public TO research_app;
GRANT ALL ON SCHEMA public TO public;

-- Grant default privileges on all tables in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO research_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO research_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO research_app;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO research_app;

-- Ensure research_app can create tables
GRANT CREATE ON SCHEMA public TO research_app;

-- Enable pgcrypto extension (for bcrypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
