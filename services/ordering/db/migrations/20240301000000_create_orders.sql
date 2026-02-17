-- migrate:up
CREATE TYPE order_status AS ENUM (
    'submitted', 'awaiting_validation', 'confirmed', 'paid', 'shipped', 'cancelled'
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL,
    status order_status NOT NULL DEFAULT 'submitted',
    description TEXT,
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    zip_code VARCHAR(20),
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    units INTEGER NOT NULL DEFAULT 1,
    picture_url VARCHAR(500),
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- migrate:down
DROP TABLE order_items;
DROP TABLE orders;
DROP TYPE order_status;
