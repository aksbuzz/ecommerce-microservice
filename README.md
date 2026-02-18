# eCommerce Microservice

An online store built with microservices. Each service does one job. They talk to each other using messages (events).

## Architecture Diagram

![High Level Arch](docs\high-level-architecture.png)

### Event Flow (Checkout)

![Checkout Flow](docs\checkout-flow.png)

## What Each Service Does

| Service | Port | Job |
|---------|------|-----|
| **Gateway** | 3000 | Front door. Sends requests to the right service |
| **Catalog** | 3001 | Products, brands, types. CRUD operations |
| **Identity** | 3002 | Users, login, register, profile |
| **Basket** | 3003 | Shopping cart. Stores items in Redis |
| **Ordering** | 3004 | Creates and tracks orders |
| **Payment** | worker | Processes payments (listens to events only) |
| **Webhooks** | 3005 | Sends HTTP calls when events happen |

## How Events Flow

When a user buys something, the event flow diagram above shows what happens:

1. User clicks "Checkout" -> `basket.checkout` event
2. Ordering service creates an order -> `order.confirmed` event
3. Payment service processes the payment
4. If payment works -> `payment.succeeded` -> order becomes `paid`
5. If payment fails -> `payment.failed` -> order becomes `cancelled`

## Tech Stack

| What | Tool |
|------|------|
| Language | TypeScript (Node.js 24+, no build needed) |
| HTTP Framework | Fastify 5 |
| Database | PostgreSQL (one DB per service) |
| Cache & Sessions | Redis |
| Message Queue | RabbitMQ |
| Frontend | React 18 + Vite + Tailwind CSS |
| Tracing | OpenTelemetry + Jaeger |
| Metrics | Prometheus + Grafana |
| Testing | node:test (unit), Cucumber (E2E) |

## Quick Start

### 1. You Need

- Docker and Docker Compose
- Node.js 24 or newer
- npm

### 2. Start Everything

```bash
# Start all containers (databases, services, frontend apps)
docker compose up -d --build

# Wait until all services are healthy (about 1-2 minutes)
docker compose ps
```

### 3. Seed Admin User

```bash
npm run seed:admin
```

This creates an admin account:
- **Email:** `admin@ecommerce.com`
- **Password:** `Admin123!`

### 4. Open the Apps

| App | URL |
|-----|-----|
| Client Store | http://localhost:5174 |
| Admin Dashboard | http://localhost:5173 |
| API Gateway | http://localhost:3000 |

### 5. Login to Admin Dashboard

1. Go to http://localhost:5173
2. Enter email: `admin@ecommerce.com`
3. Enter password: `Admin123!`
4. Click Login

## Project Structure

```
ecommerce-microservice/
|
+-- packages/              # Shared code (libraries)
|   +-- shared             # Error classes, pagination helpers
|   +-- db                 # PostgreSQL connection
|   +-- logger             # Pino logger
|   +-- event-bus          # RabbitMQ publisher/subscriber
|   +-- auth               # Session + auth middleware
|   +-- observability      # Tracing + metrics
|   +-- outbox             # Transactional outbox pattern
|   +-- api-client         # Frontend API client
|
+-- services/              # Backend microservices
|   +-- gateway            # API router (port 3000)
|   +-- catalog            # Products (port 3001)
|   +-- identity           # Users (port 3002)
|   +-- basket             # Cart (port 3003)
|   +-- ordering           # Orders (port 3004)
|   +-- payment            # Payment worker
|   +-- webhooks           # Webhook dispatcher (port 3005)
|
+-- apps/                  # Frontend applications
|   +-- admin              # Admin dashboard (port 5173)
|   +-- client             # Customer store (port 5174)
|
+-- tests/
|   +-- e2e/               # End-to-end tests (Cucumber)
|
+-- scripts/               # Helper scripts
|   +-- seed-admin.ts      # Create admin user
|   +-- init-databases.sql # Create PostgreSQL databases
|
+-- infra/                 # Infrastructure config
|   +-- prometheus/        # Metrics scraping config
|   +-- grafana/           # Dashboards and data sources
|
+-- docker-compose.yml     # Run everything with one command
+-- package.json           # Monorepo workspace config
```

## Useful Commands

```bash
# Start all services
docker compose up -d --build

# Stop all services
docker compose down

# See logs for one service
docker compose logs catalog --tail 50

# Run all unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run database migrations
npm run db:up

# Seed admin user
npm run seed:admin

# Start one service for development
npm run dev:catalog
npm run dev:identity
# ... etc
```

## Observability Tools

| Tool | URL | Login |
|------|-----|-------|
| Grafana | http://localhost:3010 | admin / admin |
| Jaeger (Tracing) | http://localhost:16686 | no login needed |
| Prometheus | http://localhost:9090 | no login needed |
| RabbitMQ Management | http://localhost:15672 | ecommerce / ecommerce_pass |

## API Endpoints

All API calls go through the Gateway at `http://localhost:3000/api/v1`.

### Identity
```
POST   /api/v1/identity/register    # Create new user
POST   /api/v1/identity/login       # Login
POST   /api/v1/identity/logout      # Logout
GET    /api/v1/identity/me          # Get current user
PATCH  /api/v1/identity/profile     # Update profile
DELETE /api/v1/identity/profile     # Delete account
```

### Catalog
```
GET    /api/v1/catalog/items        # List products (with search, filter, pagination)
GET    /api/v1/catalog/items/:id    # Get one product
POST   /api/v1/catalog/items        # Create product (auth needed)
PATCH  /api/v1/catalog/items/:id    # Update product (auth needed)
DELETE /api/v1/catalog/items/:id    # Delete product (auth needed)
GET    /api/v1/catalog/brands       # List brands
POST   /api/v1/catalog/brands       # Create brand (auth needed)
GET    /api/v1/catalog/types        # List types
POST   /api/v1/catalog/types        # Create type (auth needed)
```

### Basket
```
GET    /api/v1/basket               # Get my basket
PUT    /api/v1/basket               # Replace basket items
POST   /api/v1/basket/items         # Add item to basket
PATCH  /api/v1/basket/items/:id     # Change item quantity
DELETE /api/v1/basket/items/:id     # Remove item from basket
DELETE /api/v1/basket               # Clear basket
POST   /api/v1/basket/checkout      # Checkout basket
```

### Orders
```
GET    /api/v1/ordering             # List my orders
GET    /api/v1/ordering/:id         # Get one order
POST   /api/v1/ordering             # Create order
PATCH  /api/v1/ordering/:id/status  # Update order status
POST   /api/v1/ordering/:id/cancel  # Cancel order
```

### Webhooks
```
GET    /api/v1/webhooks             # List subscriptions
POST   /api/v1/webhooks             # Create subscription
DELETE /api/v1/webhooks/:id         # Delete subscription
```

### Health Checks (all services)
```
GET    /health           # Full health check
GET    /health/live      # Liveness check
GET    /health/ready     # Readiness check
```

## Environment Variables

Each service uses these variables (set in docker-compose.yml):

| Variable | Example | Used By |
|----------|---------|---------|
| `DATABASE_URL` | `postgres://ecommerce:ecommerce_pass@localhost:5432/ecommerce_catalog` | Catalog, Identity, Ordering, Webhooks |
| `REDIS_URL` | `redis://localhost:6379` | All services |
| `RABBITMQ_URL` | `amqp://ecommerce:ecommerce_pass@localhost:5672` | All services |
| `SESSION_SECRET` | 32+ character string | All HTTP services |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` | All services |
| `PORT` | `3001` | Each service has its own port |
| `LOG_LEVEL` | `info` | All services |
