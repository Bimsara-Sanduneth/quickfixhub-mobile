-- Demo provider accounts for local development. Password for both is "Password123!".
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
    (gen_random_uuid(), 'pipes.pro@example.com', '$2a$10$ERFJMMbHo1.0tUihETf4cOO2kV0K46zDUMkIEfJHJIXgGV5PHlwci', 'Pat Rivera', 'PROVIDER'),
    (gen_random_uuid(), 'sparkle.clean@example.com', '$2a$10$ERFJMMbHo1.0tUihETf4cOO2kV0K46zDUMkIEfJHJIXgGV5PHlwci', 'Sam Okafor', 'PROVIDER');

INSERT INTO provider_profiles (id, user_id, business_name, bio, years_experience, city, verified) VALUES
    (gen_random_uuid(), (SELECT id FROM users WHERE email = 'pipes.pro@example.com'), 'Pipes Pro Plumbing', 'Licensed plumber handling leaks, drains, and installations.', 8, 'Austin', true),
    (gen_random_uuid(), (SELECT id FROM users WHERE email = 'sparkle.clean@example.com'), 'Sparkle Clean Co.', 'Reliable home and office cleaning, standard or deep.', 4, 'Austin', false);

INSERT INTO provider_services (id, provider_profile_id, service_id, price, duration_minutes) VALUES
    (gen_random_uuid(),
        (SELECT id FROM provider_profiles WHERE business_name = 'Pipes Pro Plumbing'),
        (SELECT id FROM services WHERE slug = 'leak-repair'),
        95.00, 60),
    (gen_random_uuid(),
        (SELECT id FROM provider_profiles WHERE business_name = 'Pipes Pro Plumbing'),
        (SELECT id FROM services WHERE slug = 'drain-unclogging'),
        75.00, 45),
    (gen_random_uuid(),
        (SELECT id FROM provider_profiles WHERE business_name = 'Sparkle Clean Co.'),
        (SELECT id FROM services WHERE slug = 'standard-home-cleaning'),
        60.00, 90),
    (gen_random_uuid(),
        (SELECT id FROM provider_profiles WHERE business_name = 'Sparkle Clean Co.'),
        (SELECT id FROM services WHERE slug = 'deep-cleaning'),
        120.00, 180);
