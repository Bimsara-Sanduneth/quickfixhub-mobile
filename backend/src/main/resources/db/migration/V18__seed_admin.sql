-- Demo admin account for local development, matching V7's demo provider accounts. Password is
-- "Password123!" (same hash as the other demo accounts). Self-registration as ADMIN is rejected
-- by the backend - this is currently the only way an admin account gets created (see the
-- project's known "no admin provisioning path" gap).
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
    (gen_random_uuid(), 'admin@quickfixhub.local', '$2a$10$ERFJMMbHo1.0tUihETf4cOO2kV0K46zDUMkIEfJHJIXgGV5PHlwci', 'QuickFixHub Admin', 'ADMIN');
