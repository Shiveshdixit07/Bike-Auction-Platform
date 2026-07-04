# Bike Auction Platform

A production-grade web application for live auctions of used motorcycles. Built with Node.js (Express) backend and React (Vite) frontend, featuring real-time bidding via WebSocket, role-based access control, and comprehensive observability.

## Features

- **Real-time Bidding**: Live auction updates via Socket.IO WebSocket connections
- **Auction Lifecycle**: Full state machine (DRAFT → SCHEDULED → LIVE → ENDED → SETTLED → CANCELLED)
- **Anti-Sniping Protection**: Automatic end time extension when bids are placed in final seconds
- **Role-Based Access**: Admin and Buyer roles with appropriate permissions
- **Concurrent Bid Safety**: Optimistic concurrency control prevents bid overwrites
- **Observability**: Structured logging, Prometheus metrics, health checks
- **API Documentation**: Swagger/OpenAPI docs at `/api/docs`

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, Sequelize ORM |
| Frontend | React 18, Vite, Tailwind CSS |
| Database | MySQL 8.0 (TiDB Cloud for production) |
| Cache/PubSub | Redis 7 |
| Real-time | Socket.IO with Redis adapter |
| Auth | JWT (access + refresh tokens), bcrypt |
| Testing | Jest, Supertest, Vitest |

## Prerequisites

- **Node.js** v18+ (推荐 v20 LTS)
- **npm** v9+
- **MySQL** 8.0 (本地开发) 或 TiDB Cloud (生产环境)
- **Redis** 7+ (本地开发) 或 Upstash (生产环境)
- **Docker** & **Docker Compose** (可选，推荐用于本地开发)

## Quick Start with Docker (Recommended)

The fastest way to run the entire platform locally:

```bash
# Clone the repository
git clone <repository-url>
cd Bike-Auction-Platform

# Copy environment configuration
cp backend/.env.example backend/.env

# Start all services (MySQL, Redis, Backend, Frontend)
docker-compose up -d

# Seed demo data (creates admin user, buyers, bikes, and auctions)
docker-compose exec backend npm run seed

# Access the application
# Frontend:       http://localhost
# Backend API:    http://localhost:3000
# API Docs:       http://localhost:3000/api/docs
# Health Check:   http://localhost:3000/health
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache

# Seed demo data
docker-compose exec backend npm run seed

# Access MySQL shell
docker-compose exec mysql mysql -u root -p bike_auction

# Access Redis CLI
docker-compose exec redis redis-cli
```

## Local Development Setup (Without Docker)

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd Bike-Auction-Platform

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

```bash
# Backend configuration
cd backend
cp .env.example .env

# Edit .env with your database credentials
# Required variables:
#   DB_HOST=localhost
#   DB_PORT=3306 (or 4000 for TiDB)
#   DB_USER=root
#   DB_PASSWORD=your_password
#   DB_NAME=bike_auction
#   REDIS_URL=redis://localhost:6379
#   JWT_ACCESS_SECRET=your_random_secret
#   JWT_REFRESH_SECRET=your_random_secret
```

Generate secure JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Run twice for access and refresh secrets
```

### 3. Set Up MySQL Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE bike_auction;

# Exit MySQL
exit
```

### 4. Set Up Redis

```bash
# Start Redis (macOS with Homebrew)
brew services start redis

# Or start manually
redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### 5. Seed Demo Data

```bash
cd backend
npm run seed
```

This creates:
- **Admin user**: admin@bikeauction.com / admin123
- **Buyer users**: buyer1@bikeauction.com / buyer123, buyer2@bikeauction.com / buyer123
- **Demo bikes** with various conditions
- **Auctions** in different lifecycle states (DRAFT, SCHEDULED, LIVE, ENDED)

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend runs at http://localhost:3000
# API docs at http://localhost:3000/api/docs
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs at http://localhost:5173
```

### 7. Verify Installation

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":...}
```

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx jest test/biddingEngine.test.js

# Run tests in watch mode
npx jest --watch
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests with UI
npx vitest --ui
```

### Test Coverage

Backend tests cover:
- Bidding engine logic (increment validation, self-bid prevention, anti-sniping)
- Concurrent bid race conditions
- API endpoints (auth, auctions, bids)
- Integration tests

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/refresh` | Refresh access token |

### Auctions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/auctions` | List auctions (filterable) | Public |
| GET | `/api/v1/auctions/:id` | Get auction details | Public |
| POST | `/api/v1/auctions` | Create auction | Admin |
| PATCH | `/api/v1/auctions/:id` | Update auction | Admin |
| POST | `/api/v1/auctions/:id/publish` | Publish auction | Admin |
| POST | `/api/v1/auctions/:id/cancel` | Cancel auction | Admin |
| POST | `/api/v1/auctions/:id/bids` | Place a bid | Buyer |
| GET | `/api/v1/auctions/:id/bids` | Get bid history | Public |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/me` | Get current user profile |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/dashboard` | Get dashboard metrics |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness check |
| GET | `/health/ready` | Readiness check (DB + Redis) |
| GET | `/metrics` | Prometheus metrics |
| GET | `/api/docs` | Swagger API documentation |

## WebSocket Events

Connect to Socket.IO namespace `/auctions`:

### Client → Server
```javascript
// Join auction room
socket.emit('join_auction', { auctionId: 'uuid' })

// Leave auction room
socket.emit('leave_auction', { auctionId: 'uuid' })
```

### Server → Client
```javascript
// New bid placed
socket.on('bid_placed', (data) => {
  // data: { auctionId, amount, bidderId(masked), newEndTime? }
})

// Auction status changed
socket.on('auction_status_changed', (data) => {
  // data: { auctionId, status }
})

// Bid rejected (sent only to bidder)
socket.on('bid_rejected', (data) => {
  // data: { reason }
})
```

## Demo Credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bikeauction.com | admin123 |
| Buyer | buyer1@bikeauction.com | buyer123 |
| Buyer | buyer2@bikeauction.com | buyer123 |

## Project Structure

```
Bike-Auction-Platform/
├── backend/
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/         # Authentication
│   │   │   ├── users/        # User management
│   │   │   ├── bikes/        # Bike CRUD
│   │   │   ├── auctions/     # Auction lifecycle
│   │   │   ├── bids/         # Bidding engine
│   │   │   ├── admin/        # Admin dashboard
│   │   │   ├── notifications/# WebSocket gateway
│   │   │   ├── health/       # Health checks
│   │   │   └── metrics/      # Prometheus metrics
│   │   ├── common/           # Shared middleware
│   │   ├── config/           # Configuration
│   │   ├── models/           # Sequelize models
│   │   ├── app.js            # Express app setup
│   │   ├── server.js         # HTTP server entry
│   │   └── seed.js           # Database seeder
│   ├── test/                 # Test files
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── components/       # Reusable components
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities (API, Socket)
│   │   ├── App.jsx           # Root component
│   │   └── main.jsx          # Entry point
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── render.yaml               # Render.com deployment
├── ARCHITECTURE.md           # Architecture documentation
├── DEPLOYMENT.md             # Deployment guide
├── ASSUMPTIONS.md            # Assumptions & trade-offs
└── README.md                 # This file
```

## Environment Variables

### Backend (.env)

```bash
# Node
NODE_ENV=development
PORT=3000

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=bike_auction

# Redis
REDIS_URL=redis://localhost:6379

# JWT (generate secure strings for production)
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BID_RATE_LIMIT_WINDOW_MS=10000
BID_RATE_LIMIT_MAX_REQUESTS=5

# Anti-Sniping
ANTI_SNIPE_EXTENSION_SECONDS=30
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:3000
```

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

**MySQL connection refused:**
```bash
# Check MySQL status
brew services list  # macOS
sudo systemctl status mysql  # Linux

# Start MySQL
brew services start mysql  # macOS
sudo systemctl start mysql  # Linux
```

**Redis connection refused:**
```bash
# Check Redis status
redis-cli ping

# Start Redis
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

**Docker containers won't start:**
```bash
# Check Docker status
docker ps

# View container logs
docker-compose logs backend

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

**Seed script fails:**
```bash
# Ensure database exists and is accessible
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS bike_auction"

# Run seed script again
cd backend
npm run seed
```

### Reset Everything

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Fresh start
docker-compose up -d
docker-compose exec backend npm run seed
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Documentation

- [Architecture Document](./ARCHITECTURE.md) - System design and technical decisions
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Assumptions & Trade-offs](./ASSUMPTIONS.md) - Design decisions and rationale
- [Task Specification](./Task.md) - Original project requirements
