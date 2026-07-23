ALTER TABLE transport_passenger_ratings
    ADD COLUMN IF NOT EXISTS comment_verified boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS comment_verified_at timestamp NULL;