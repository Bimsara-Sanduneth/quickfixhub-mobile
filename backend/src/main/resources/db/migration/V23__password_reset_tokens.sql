-- One-time codes for the forgot-password flow. user_id is UNIQUE: requesting a new code replaces
-- any outstanding one for that account rather than piling up (AuthService.forgotPassword).
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    -- BCrypt hash of the 6-digit code - never stored in the clear, same reasoning as password_hash.
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    -- Failed verify attempts; the token self-destructs once this hits the configured cap.
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
