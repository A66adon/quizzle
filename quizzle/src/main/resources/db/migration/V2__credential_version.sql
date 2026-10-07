ALTER TABLE accounts ADD COLUMN credential_version BIGINT NOT NULL DEFAULT 0;
CREATE INDEX verification_tokens_expiry_idx ON email_verification_tokens(expires_at);
CREATE INDEX reset_tokens_expiry_idx ON password_reset_tokens(expires_at);
