INSERT INTO app_settings (key, value)
VALUES ('total_active_vehicles_count', '5000')
ON CONFLICT (key) DO NOTHING;