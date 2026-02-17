-- migrate:up
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE catalog_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    picture_file_name VARCHAR(255),
    catalog_type_id INTEGER NOT NULL REFERENCES catalog_types(id),
    catalog_brand_id INTEGER NOT NULL REFERENCES catalog_brands(id),
    available_stock INTEGER NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
    max_stock_threshold INTEGER NOT NULL DEFAULT 100,
    on_reorder BOOLEAN NOT NULL DEFAULT FALSE,
    restock_threshold INTEGER NOT NULL DEFAULT 10
);

CREATE INDEX idx_catalog_items_brand ON catalog_items(catalog_brand_id);
CREATE INDEX idx_catalog_items_type ON catalog_items(catalog_type_id);
CREATE INDEX idx_catalog_items_name ON catalog_items USING gin(name gin_trgm_ops);

-- Seed data
INSERT INTO catalog_items (name, description, price, picture_file_name, catalog_type_id, catalog_brand_id, available_stock) VALUES
    ('.NET Bot Black Sweatshirt', 'A .NET Bot black sweatshirt', 19.50, '.NET-Bot-Black-Sweatshirt.png', 2, 2, 100),
    ('.NET Black & White Mug', 'A .NET black and white mug', 8.50, '.NET-Black-White-Mug.png', 1, 2, 89),
    ('Prism White T-Shirt', 'A white t-shirt with prism design', 12.00, 'Prism-White-T-Shirt.png', 2, 5, 56),
    ('.NET Foundation Sweatshirt', 'A .NET Foundation sweatshirt', 12.00, '.NET-Foundation-Sweatshirt.png', 2, 2, 120),
    ('Roslyn Red Sheet', 'A Roslyn red sheet', 8.50, 'Roslyn-Red-Sheet.png', 3, 5, 55),
    ('.NET Blue Sweatshirt', 'A .NET blue sweatshirt', 12.00, '.NET-Blue-Sweatshirt.png', 2, 2, 17),
    ('Roslyn Red T-Shirt', 'A Roslyn red t-shirt', 12.00, 'Roslyn-Red-T-Shirt.png', 2, 5, 8),
    ('Kudu Purple Sweatshirt', 'A Kudu purple sweatshirt', 8.50, 'Kudu-Purple-Sweatshirt.png', 2, 5, 34),
    ('Cup<T> White Mug', 'A Cup<T> white mug', 12.00, 'Cup-T-White-Mug.png', 1, 5, 76),
    ('.NET Foundation Sheet', 'A .NET Foundation sheet', 12.00, '.NET-Foundation-Sheet.png', 3, 2, 11),
    ('Cup<T> Sheet', 'A Cup<T> sheet', 8.50, 'Cup-T-Sheet.png', 3, 5, 3),
    ('Prism White USB Memory Stick', 'A Prism white USB memory stick', 12.00, 'Prism-White-USB-Memory-Stick.png', 4, 5, 0);

-- migrate:down
DROP TABLE catalog_items;
