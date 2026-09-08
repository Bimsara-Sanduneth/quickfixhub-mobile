CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_profile_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    provider_service_id UUID NOT NULL REFERENCES provider_services(id) ON DELETE RESTRICT,
    address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    price_at_booking NUMERIC(10,2) NOT NULL,
    notes VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_customer_id ON bookings (customer_id);
CREATE INDEX idx_bookings_provider_profile_id ON bookings (provider_profile_id);
