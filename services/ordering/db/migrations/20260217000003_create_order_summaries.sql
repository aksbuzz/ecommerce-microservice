-- migrate:up
CREATE TABLE order_summaries (
    order_id INTEGER PRIMARY KEY,
    buyer_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    item_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_summaries_buyer ON order_summaries (buyer_id);
CREATE INDEX idx_order_summaries_status ON order_summaries (status);

-- migrate:down
DROP TABLE order_summaries;
