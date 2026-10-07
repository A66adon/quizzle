CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    normalized_email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'DISABLED')),
    password_hash TEXT,
    roles TEXT[] NOT NULL DEFAULT '{}',
    allow_late_join BOOLEAN NOT NULL DEFAULT FALSE,
    auto_advance_delay_ms BIGINT NOT NULL DEFAULT 5000 CHECK (auto_advance_delay_ms BETWEEN 0 AND 120000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (normalized_email = lower(btrim(normalized_email)) AND normalized_email <> '')
);

CREATE TABLE external_identities (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider = 'google'),
    provider_subject TEXT NOT NULL,
    provider_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_subject)
);
CREATE INDEX external_identities_account_idx ON external_identities(account_id);

CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    token_digest CHAR(64) NOT NULL UNIQUE CHECK (token_digest ~ '^[0-9a-f]{64}$'),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX verification_tokens_account_idx ON email_verification_tokens(account_id);

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    token_digest CHAR(64) NOT NULL UNIQUE CHECK (token_digest ~ '^[0-9a-f]{64}$'),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reset_tokens_account_idx ON password_reset_tokens(account_id);

CREATE TABLE quizzes (
    id UUID PRIMARY KEY,
    owner_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    slug VARCHAR(120) NOT NULL CHECK (slug ~ '^[A-Za-z0-9_-]+\.ya?ml$'),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT NOT NULL,
    question_count INTEGER NOT NULL CHECK (question_count >= 0),
    content JSONB NOT NULL,
    version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (owner_account_id, slug)
);

CREATE TABLE session_snapshots (
    codehash TEXT PRIMARY KEY,
    owner_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    schema_version INTEGER NOT NULL,
    state TEXT NOT NULL,
    quiz_slug TEXT NOT NULL,
    current_question_index INTEGER NOT NULL,
    server_start_epoch_ms BIGINT NOT NULL,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX snapshots_owner_idx ON session_snapshots(owner_account_id);
