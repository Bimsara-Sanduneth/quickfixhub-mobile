-- Reference/taxonomy data for the service catalog, not user-generated content.
INSERT INTO service_categories (id, name, slug, description) VALUES
    (gen_random_uuid(), 'Plumbing', 'plumbing', 'Leaks, installations, and pipe repairs'),
    (gen_random_uuid(), 'Electrical', 'electrical', 'Wiring, fixtures, and electrical repairs'),
    (gen_random_uuid(), 'Cleaning', 'cleaning', 'Home and office cleaning services'),
    (gen_random_uuid(), 'Landscaping', 'landscaping', 'Lawn care and garden maintenance'),
    (gen_random_uuid(), 'Painting', 'painting', 'Interior and exterior painting'),
    (gen_random_uuid(), 'Appliance Repair', 'appliance-repair', 'Repair and maintenance for home appliances');

INSERT INTO services (id, category_id, name, slug, description) VALUES
    (gen_random_uuid(), (SELECT id FROM service_categories WHERE slug = 'plumbing'), 'Leak Repair', 'leak-repair', 'Fixing leaking pipes and fixtures'),
    (gen_random_uuid(), (SELECT id FROM service_categories WHERE slug = 'plumbing'), 'Drain Unclogging', 'drain-unclogging', 'Clearing blocked drains'),
    (gen_random_uuid(), (SELECT id FROM service_categories WHERE slug = 'plumbing'), 'Water Heater Installation', 'water-heater-installation', 'Installing new water heaters'),

    (gen_random_uuid(), (SELECT id FROM service_categories WHERE slug = 'electrical'), 'Outlet Installation', 'outlet-installation', 'Installing new electrical outlets'),
    (gen_random_uuid(), (SELECT id FROM service_categories WHERE slug = 'electrical'), 'Light Fixture Repair', 'light-fixture-repair', 'Repairing or replacing light fixtures'),

    (gen_random_uuid(), (SELECT id FROM service_categories WHERE slug = 'cleaning'), 'Standard Home Cleaning', 'standard-home-cleaning', 'Routine cleaning for homes'),
    (gen_random_uuid(), (SELECT id FROM service_categories WHERE slug = 'cleaning'), 'Deep Cleaning', 'deep-cleaning', 'Thorough top-to-bottom cleaning'),

    (gen_random_uuid(), (SELECT id FROM service_categories WHERE slug = 'landscaping'), 'Lawn Mowing', 'lawn-mowing', 'Regular lawn mowing service'),
    (gen_random_uuid(), (SELECT id FROM service_categories WHERE slug = 'landscaping'), 'Garden Maintenance', 'garden-maintenance', 'Pruning, weeding, and general upkeep'),

    (gen_random_uuid(), (SELECT id FROM service_categories WHERE slug = 'painting'), 'Interior Painting', 'interior-painting', 'Painting interior walls and ceilings'),
    (gen_random_uuid(), (SELECT id FROM service_categories WHERE slug = 'painting'), 'Exterior Painting', 'exterior-painting', 'Painting exterior surfaces'),

    (gen_random_uuid(), (SELECT id FROM service_categories WHERE slug = 'appliance-repair'), 'Refrigerator Repair', 'refrigerator-repair', 'Diagnosing and fixing refrigerators'),
    (gen_random_uuid(), (SELECT id FROM service_categories WHERE slug = 'appliance-repair'), 'Washing Machine Repair', 'washing-machine-repair', 'Diagnosing and fixing washing machines');
