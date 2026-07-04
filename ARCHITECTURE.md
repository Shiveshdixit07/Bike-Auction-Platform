# Architecture Document

## System Overview

The Bike Auction Platform is a production-grade web application built as a modular monolith with clear feature boundaries. It supports real-time bidding, multiple simultaneous auctions, and role-based access control.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌─────────────-┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  React SPA   │  │  Mobile Web │  │   Admin Dashboard   │ │
│  │  (Vite)      │  │             │  │                     │ │
│  └──────┬───────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼─────────────────┼────────────────────┼────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Express.js (REST + WebSocket)                      │    │
│  │  - Authentication (JWT)                             │    │
│  │  - Rate Limiting                                    │    │
│  │  - Input Validation                                 │    │
│  │  - CORS / Helmet Security                           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────────────┐
│                    Service Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Auctions │  │   Bids   │  │   Bikes  │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │         │
│  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐   │
│  │  Users   │  │  Admin   │  │  WS      │  │  Audit   │   │
│  │  Service │  │  Service │  │  Gateway │  │  Log     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────┬─────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                    Data Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │     MySQL        │  │     Redis       │                  │
│  │  - Users         │  │  - Sessions     │                  │
│  │  - Bikes         │  │  - Bid Locks    │                  │
│  │  - Auctions      │  │  - Pub/Sub      │                  │
│  │  - Bids          │  │  - Cache        │                  │
│  │  - Audit Logs    │  │  - Rate Limits  │                  │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Module Architecture

Each feature module follows a consistent structure:

```
modules/
├── moduleName/
│   ├── routes.js       # Express route definitions + Swagger docs
│   ├── controller.js   # Request/response handling
│   ├── service.js      # Business logic
│   └── validation.js   # Joi validation schemas
```

### Module Boundaries

- **Auth Module**: User registration, login, token management
- **Users Module**: User profile management
- **Bikes Module**: Bike CRUD operations
- **Auctions Module**: Auction lifecycle management, state machine
- **Bids Module**: Bid placement, validation, concurrent handling
- **Admin Module**: Dashboard metrics, auction management
- **Notifications Module**: WebSocket gateway, real-time updates

## Data Model

### User
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('BUYER', 'ADMIN') DEFAULT 'BUYER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bike
```sql
CREATE TABLE bikes (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  images JSON,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  mileage INT NOT NULL,
  condition ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR') NOT NULL,
  owner_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Auction
```sql
CREATE TABLE auctions (
  id UUID PRIMARY KEY,
  bike_id UUID NOT NULL,
  status ENUM('DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', 'SETTLED', 'CANCELLED') DEFAULT 'DRAFT',
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  starting_price DECIMAL(10,2) NOT NULL,
  bid_increment DECIMAL(10,2) NOT NULL,
  reserve_price DECIMAL(10,2),
  current_highest_bid DECIMAL(10,2) DEFAULT 0,
  current_highest_bidder_id UUID,
  created_by UUID NOT NULL,
  extend_on_last_minute_bid BOOLEAN DEFAULT TRUE,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bike_id) REFERENCES bikes(id),
  FOREIGN KEY (current_highest_bidder_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Bid
```sql
CREATE TABLE bids (
  id UUID PRIMARY KEY,
  auction_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('ACCEPTED', 'REJECTED') NOT NULL,
  rejection_reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### AuditLog
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  actor UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type ENUM('USER', 'AUCTION', 'BID', 'BIKE') NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor) REFERENCES users(id)
);
```

## Real-Time Design

### WebSocket Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client 1  │     │   Client 2  │     │   Client 3  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                    Socket.IO Server                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Redis Adapter (Pub/Sub)                        │   │
│  │  - Room: auction:{auctionId}                    │   │
│  │  - Horizontal scaling across instances          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
                    ┌───────────┐
                    │   Redis   │
                    │  Pub/Sub  │
                    └───────────┘
```

### Events

- `join_auction`: Client joins auction room
- `leave_auction`: Client leaves auction room
- `bid_placed`: Broadcast to all clients in auction room
- `auction_status_changed`: Broadcast status changes

## Bidding Engine

### Concurrency Safety

The bidding engine uses **optimistic concurrency control** with MySQL's version field:

1. Client sends bid request
2. Server acquires Redis distributed lock (5s timeout)
3. Server validates bid against current auction state
4. Server attempts `UPDATE` with version check
5. If version mismatch (concurrent bid), retry or reject
6. On success: persist bid, update auction, broadcast via WebSocket

### Anti-Sniping Protection

When `extendOnLastMinuteBid` is enabled:
- If a bid is placed within the last N seconds (default: 30)
- The auction's `endTime` is extended by N seconds
- Prevents last-second bid sniping

### Bid Validation Rules

1. Auction must be `LIVE` and within time window
2. Bid must be ≥ `currentHighestBid + bidIncrement` (or ≥ `startingPrice` for first bid)
3. Bidder cannot outbid themselves consecutively
4. Reserve price must be met for auction to settle

## Scalability Considerations

### Horizontal Scaling

- **Stateless API servers**: Run multiple Express instances behind load balancer
- **Redis adapter**: Socket.IO scales across instances via Redis Pub/Sub
- **MySQL**: Use read replicas for read scaling

### Bid Write Path

- **Optimistic concurrency**: No distributed locks needed for normal operation
- **Redis lock**: Short-term lock (5s) prevents duplicate processing
- **Version field**: Ensures no bid overwrites a higher bid

### Read Scaling

- **Redis cache**: Active auction summaries with short TTL
- **MySQL read replicas**: Offload read queries
- **Index optimization**: Strategic indexes on frequently queried fields

### Moving to Microservices

Under real load, the modular monolith can be decomposed:

1. **Auction Service**: Manages auction lifecycle
2. **Bidding Service**: Handles bid processing
3. **Notification Service**: WebSocket gateway
4. **User Service**: Authentication and user management
5. **Bike Service**: Bike inventory management

Each service would have its own database and communicate via message queues (Redis/RabbitMQ).

## Security

### Authentication

- JWT access tokens (15 min expiry)
- Refresh token rotation
- Password hashing with bcrypt (12 rounds)

### Authorization

- Role-based middleware (`requireAdmin`)
- Resource ownership validation

### Input Validation

- Joi schema validation on all inputs
- Unknown fields stripped
- Structured error responses

### Rate Limiting

- Redis-backed rate limiting
- Separate limits for auth and bid endpoints

### HTTP Security

- Helmet for security headers
- CORS restricted to known origins
- No raw user input in queries

## Observability

### Logging

- Structured JSON logging (pino)
- Request correlation IDs
- Correct log levels (debug/info/warn/error)

### Metrics

- Prometheus format via `/metrics`
- Request duration histograms
- Bid throughput counters
- Active auction gauge
- WebSocket connection gauge

### Health Checks

- `/health`: Liveness check
- `/health/ready`: Readiness (MySQL + Redis connectivity)

## Docker Deployment

### Services

- **MySQL**: Primary datastore
- **Redis**: Caching, rate limiting, WebSocket scaling
- **Backend**: Express API server
- **Frontend**: React SPA (Nginx)

### Volumes

- `mysql_data`: Persistent MySQL storage
- `redis_data`: Persistent Redis storage

### Networks

- `bike-auction-network`: Bridge network for service communication
