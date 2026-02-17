-- Create separate databases for each service (owned by ecommerce user)
CREATE DATABASE ecommerce_identity OWNER ecommerce;
CREATE DATABASE ecommerce_ordering OWNER ecommerce;
CREATE DATABASE ecommerce_webhooks OWNER ecommerce;

-- Grant privileges (ecommerce_catalog is already owned via POSTGRES_DB/POSTGRES_USER)
GRANT ALL PRIVILEGES ON DATABASE ecommerce_catalog TO ecommerce;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_identity TO ecommerce;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_ordering TO ecommerce;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_webhooks TO ecommerce;
