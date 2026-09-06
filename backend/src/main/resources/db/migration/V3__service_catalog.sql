CREATE TABLE service_categories (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE services (
    id UUID PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

CREATE INDEX idx_services_category_id ON services (category_id);
