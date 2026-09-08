-- Mocked payment ledger (no gateway - see Payment.java). One row per booking, created the
-- moment a booking reaches COMPLETED.
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    method VARCHAR(30) NOT NULL DEFAULT 'MOCK',
    paid_at TIMESTAMPTZ NOT NULL,
    refund_amount NUMERIC(10,2),
    refund_reason VARCHAR(500),
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill: every booking already COMPLETED before this migration gets a matching PAID payment
-- row, using its recorded price and completed_at as the paid_at timestamp - otherwise those
-- bookings would have no receipt and would never appear in the admin payments list.
INSERT INTO payments (id, booking_id, amount, status, method, paid_at)
SELECT gen_random_uuid(), id, price_at_booking, 'PAID', 'MOCK', COALESCE(completed_at, updated_at)
FROM bookings
WHERE status = 'COMPLETED';
