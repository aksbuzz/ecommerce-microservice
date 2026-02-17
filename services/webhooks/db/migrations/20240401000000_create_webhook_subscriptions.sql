-- migrate:up
CREATE TABLE webhook_subscriptions (
    id SERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    token VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_subs_event_type ON webhook_subscriptions(event_type);

-- migrate:down
DROP TABLE webhook_subscriptions;
