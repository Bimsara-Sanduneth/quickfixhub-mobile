-- Services now require a minimum price of Rs. 2,000 (see AddProviderServiceRequest). The demo
-- provider_services seeded in V7 predate the LKR currency switch and are well under that floor
-- ($60-$120, displayed as Rs. 60.00-120.00) - bump them to realistic LKR prices above the minimum.
-- Existing bookings keep their own already-recorded price; this only touches the provider's
-- current listed price for future bookings.
UPDATE provider_services SET price = 4500.00
    WHERE provider_profile_id = (SELECT id FROM provider_profiles WHERE business_name = 'Pipes Pro Plumbing')
    AND service_id = (SELECT id FROM services WHERE slug = 'leak-repair');

UPDATE provider_services SET price = 3500.00
    WHERE provider_profile_id = (SELECT id FROM provider_profiles WHERE business_name = 'Pipes Pro Plumbing')
    AND service_id = (SELECT id FROM services WHERE slug = 'drain-unclogging');

UPDATE provider_services SET price = 2500.00
    WHERE provider_profile_id = (SELECT id FROM provider_profiles WHERE business_name = 'Sparkle Clean Co.')
    AND service_id = (SELECT id FROM services WHERE slug = 'standard-home-cleaning');

UPDATE provider_services SET price = 6000.00
    WHERE provider_profile_id = (SELECT id FROM provider_profiles WHERE business_name = 'Sparkle Clean Co.')
    AND service_id = (SELECT id FROM services WHERE slug = 'deep-cleaning');
