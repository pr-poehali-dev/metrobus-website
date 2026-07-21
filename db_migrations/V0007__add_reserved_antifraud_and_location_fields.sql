ALTER TABLE transport_passenger_ratings
    ADD COLUMN IF NOT EXISTS possibly_not_passenger boolean NULL,
    ADD COLUMN IF NOT EXISTS anti_fraud_reason text NULL,
    ADD COLUMN IF NOT EXISTS rating_client_id varchar(36) NULL,
    ADD COLUMN IF NOT EXISTS location_id varchar(10) NULL,
    ADD COLUMN IF NOT EXISTS location_code varchar(25) NULL,
    ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false;
