-- migrate:up
CREATE TABLE catalog_types (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO catalog_types (type) VALUES
    ('Mug'),
    ('T-Shirt'),
    ('Sheet'),
    ('USB Memory Stick');

-- migrate:down
DROP TABLE catalog_types;
