INSERT INTO app_settings (key, value, updated_at)
VALUES ('total_active_routes_count', '700', now())
ON CONFLICT (key) DO NOTHING;