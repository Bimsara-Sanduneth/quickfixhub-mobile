ALTER TABLE provider_profiles ADD COLUMN service_radius_km INTEGER;

-- One row per weekday (0=Monday .. 6=Sunday, ISO-8601 ordering) per provider. Rows are only
-- created once a provider saves the availability screen (2t) - a provider profile with no rows
-- here simply hasn't set hours yet; nothing currently reads this to gate bookings.
CREATE TABLE provider_availability (
    id UUID PRIMARY KEY,
    provider_profile_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_open BOOLEAN NOT NULL DEFAULT FALSE,
    start_time VARCHAR(5),
    end_time VARCHAR(5),
    UNIQUE (provider_profile_id, day_of_week)
);

CREATE INDEX idx_provider_availability_provider_profile_id ON provider_availability (provider_profile_id);
