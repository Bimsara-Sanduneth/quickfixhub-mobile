-- City-level coordinates for the discovery map (2g) and booking-tracking map (2l). Populated
-- best-effort by GeocodingService when a provider creates their profile; existing providers are
-- backfilled once, out of band, from the same free geocoder.
ALTER TABLE provider_profiles ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE provider_profiles ADD COLUMN longitude DOUBLE PRECISION;
