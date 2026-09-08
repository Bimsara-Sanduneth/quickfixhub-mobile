-- Expands the booking lifecycle from the original 5-state model to match the design's
-- REQUESTED -> ACCEPTED -> EN_ROUTE -> IN_PROGRESS -> COMPLETED path (plus DECLINED / CANCELLED),
-- and adds per-transition timestamp columns so the mobile tracking screen has real history to
-- render without a separate status-history table.
ALTER TABLE bookings
    ADD COLUMN expires_at TIMESTAMPTZ,
    ADD COLUMN accepted_at TIMESTAMPTZ,
    ADD COLUMN en_route_at TIMESTAMPTZ,
    ADD COLUMN in_progress_at TIMESTAMPTZ,
    ADD COLUMN completed_at TIMESTAMPTZ,
    ADD COLUMN declined_at TIMESTAMPTZ,
    ADD COLUMN cancelled_at TIMESTAMPTZ;

-- Backfill existing rows onto the richer machine: PENDING -> REQUESTED, CONFIRMED -> ACCEPTED;
-- DECLINED/CANCELLED/COMPLETED keep their name. updated_at is the closest available timestamp for
-- whichever transition already happened - not real history, but nothing more precise exists for
-- rows written before this migration.
UPDATE bookings SET status = 'REQUESTED' WHERE status = 'PENDING';
UPDATE bookings SET status = 'ACCEPTED', accepted_at = updated_at WHERE status = 'CONFIRMED';
UPDATE bookings SET declined_at = updated_at WHERE status = 'DECLINED';
UPDATE bookings SET cancelled_at = updated_at WHERE status = 'CANCELLED';
UPDATE bookings SET completed_at = updated_at, accepted_at = COALESCE(accepted_at, created_at) WHERE status = 'COMPLETED';
