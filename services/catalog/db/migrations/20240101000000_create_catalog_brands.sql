-- migrate:up
CREATE TABLE catalog_brands (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO catalog_brands (brand) VALUES
    ('Azure'),
    ('.NET'),
    ('Visual Studio'),
    ('SQL Server'),
    ('Other');

-- migrate:down
DROP TABLE catalog_brands;
