-- Quick-select review chips (2p), stored as a single comma-joined column (see TagsConverter) -
-- null/empty for every review created before this.
ALTER TABLE reviews ADD COLUMN tags VARCHAR(500);
