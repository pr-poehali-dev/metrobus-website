ALTER TABLE transport_passenger_ratings
    ADD COLUMN IF NOT EXISTS vehicle_number integer NULL,
    ADD COLUMN IF NOT EXISTS nearest_stop_distance_m integer NULL,
    ADD COLUMN IF NOT EXISTS distance_to_route_m integer NULL,
    ADD COLUMN IF NOT EXISTS page_opened_lat double precision NULL,
    ADD COLUMN IF NOT EXISTS page_opened_lng double precision NULL,
    ADD COLUMN IF NOT EXISTS page_opened_accuracy_m integer NULL,
    ADD COLUMN IF NOT EXISTS submit_lat double precision NULL,
    ADD COLUMN IF NOT EXISTS submit_lng double precision NULL,
    ADD COLUMN IF NOT EXISTS submit_accuracy_m integer NULL,
    ADD COLUMN IF NOT EXISTS movement_distance_m double precision NULL,
    ADD COLUMN IF NOT EXISTS geo_enriched_at timestamp NULL;
