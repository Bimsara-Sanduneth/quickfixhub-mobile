-- Cover photo (2q, and shown on a provider's public detail page) - same data: URI storage shape
-- as photo_data_uri (V19). Every user has both fields, not just providers - customers can set one
-- too, it just currently has nowhere public to display.
ALTER TABLE users ADD COLUMN cover_photo_data_uri TEXT;
