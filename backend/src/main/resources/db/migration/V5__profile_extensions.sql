ALTER TABLE users ADD COLUMN phone VARCHAR(32);

CREATE TABLE addresses (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    address_text VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_addresses_user_id ON addresses (user_id);
