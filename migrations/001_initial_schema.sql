-- filepath: database/migrations/001_initial_schema.sql
-- Initial schema migration
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    properties JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);

CREATE OR REPLACE VIEW event_summary AS
SELECT 
    event_name,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    DATE_TRUNC('day', timestamp) as day
FROM events 
GROUP BY event_name, DATE_TRUNC('day', timestamp)
ORDER BY day DESC;