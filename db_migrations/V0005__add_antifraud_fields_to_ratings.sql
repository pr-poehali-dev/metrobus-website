ALTER TABLE transport_passenger_ratings
    ADD COLUMN IF NOT EXISTS uuid varchar(50) NULL,
    ADD COLUMN IF NOT EXISTS result_false varchar(127) NULL,
    ADD COLUMN IF NOT EXISTS ip varchar(20) NULL,
    ADD COLUMN IF NOT EXISTS is_passenger boolean NULL,
    ADD COLUMN IF NOT EXISTS operator_id integer NULL,
    ADD COLUMN IF NOT EXISTS operator_title text NULL,
    ADD COLUMN IF NOT EXISTS transport_opened_lat double precision NULL,
    ADD COLUMN IF NOT EXISTS transport_opened_lng double precision NULL,
    ADD COLUMN IF NOT EXISTS transport_opened_dist integer NULL,
    ADD COLUMN IF NOT EXISTS transport_submit_lat double precision NULL,
    ADD COLUMN IF NOT EXISTS transport_submit_lng double precision NULL,
    ADD COLUMN IF NOT EXISTS transport_submit_dist integer NULL;
