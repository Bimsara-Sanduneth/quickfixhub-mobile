-- In-app notification center (Phase 5, scoped down from real OS push - see NotificationService).
-- One row per event, always addressed to a single recipient.
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body VARCHAR(1000) NOT NULL,
    -- Nullable - only booking/message-related notifications deep-link anywhere; verification
    -- decisions just open the Verification screen, no id needed.
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient_created ON notifications (recipient_id, created_at DESC);
