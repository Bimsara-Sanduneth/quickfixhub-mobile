-- Profile photo (2q), stored as a data: URI directly in the row - no object storage exists in
-- this project yet. TEXT rather than a size-limited VARCHAR since a base64-encoded photo is a
-- few hundred KB to a few MB; the real size cap lives in UpdatePhotoRequest's validation.
ALTER TABLE users ADD COLUMN photo_data_uri TEXT;
