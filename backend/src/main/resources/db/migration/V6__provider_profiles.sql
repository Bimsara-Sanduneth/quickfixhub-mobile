CREATE TABLE provider_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    bio TEXT,
    years_experience INTEGER,
    city VARCHAR(255),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE provider_services (
    id UUID PRIMARY KEY,
    provider_profile_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    price NUMERIC(10,2) NOT NULL,
    duration_minutes INTEGER,
    UNIQUE (provider_profile_id, service_id)
);

CREATE INDEX idx_provider_services_provider_profile_id ON provider_services (provider_profile_id);
