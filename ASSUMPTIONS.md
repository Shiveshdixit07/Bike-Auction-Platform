# Assumptions and Trade-offs

This document records all assumptions made during development and their implications.

## Technology Choices

### 1. JavaScript Everywhere (No TypeScript)

**Assumption**: Using JavaScript for both backend and frontend instead of TypeScript.

**Trade-off**:
- **Pro**: Simpler toolchain, no compilation step, faster iteration
- **Con**: No static type checking, potential runtime errors
- **Decision**: Acceptable for this project size; can migrate to TypeScript later

### 2. MySQL as Primary Database

**Assumption**: Using MySQL instead of MongoDB or PostgreSQL.

**Trade-off**:
- **Pro**: ACID transactions, mature ecosystem, strong consistency
- **Con**: Less flexible schema, more rigid structure
- **Decision**: MySQL provides strong consistency for auction operations; transactions ensure data integrity

### 3. Docker for Deployment

**Assumption**: Using Docker and Docker Compose for deployment.

**Trade-off**:
- **Pro**: Consistent environments, easy deployment, containerized services
- **Con**: Additional learning curve, resource overhead
- **Decision**: Docker simplifies deployment and ensures consistency across environments

### 4. Redis for Caching and Real-Time

**Assumption**: Using Redis for caching, rate limiting, and WebSocket scaling.

**Trade-off**:
- **Pro**: Fast, supports pub/sub, easy to use
- **Con**: Additional service to maintain, memory-based
- **Decision**: Redis is essential for real-time features and performance optimization

### 5. No NestJS/DI Framework

**Assumption**: Using plain Express with modular structure instead of NestJS.

**Trade-off**:
- **Pro**: Simpler, less boilerplate, easier to understand
- **Con**: No built-in dependency injection, manual module organization
- **Decision**: Express is sufficient for this project size; modular structure provides similar organization

### 6. No Next.js/SSR

**Assumption**: Using plain React SPA via Vite instead of Next.js with server-side rendering.

**Trade-off**:
- **Pro**: Simpler deployment, no server-side rendering complexity
- **Con**: No SEO optimization, slower initial load
- **Decision**: Auction app is authenticated; SEO not required for private content

## Business Logic

### 7. Self-Bid Prevention

**Assumption**: Rejecting consecutive bids from the same user (cannot outbid yourself).

**Trade-off**:
- **Pro**: Prevents artificial bid inflation, fairer auctions
- **Con**: Users cannot increase their own bid if they change their mind
- **Decision**: Standard practice in auction platforms; user can place new bid after being outbid

### 8. Anti-Sniping Extension

**Assumption**: Extending auction end time by 30 seconds when bid is placed in last 30 seconds.

**Trade-off**:
- **Pro**: Prevents last-second sniping, fairer for all bidders
- **Con**: Auctions can extend indefinitely if bidding is active
- **Decision**: Configurable extension period; can be disabled per auction

### 9. Reserve Price Hidden from Buyers

**Assumption**: Reserve price is not visible to buyers, only used for settlement.

**Trade-off**:
- **Pro**: Prevents bid manipulation around reserve price
- **Con**: Bidders don't know minimum price to win
- **Decision**: Standard auction practice; can be made visible in future

### 10. Single Currency (USD)

**Assumption**: All prices in USD only.

**Trade-off**:
- **Pro**: Simplifies implementation, no exchange rate complexity
- **Con**: International users must convert manually
- **Decision**: Can add multi-currency support later if needed

## Security

### 11. JWT Access + Refresh Tokens

**Assumption**: Using short-lived access tokens (15 min) with refresh token rotation.

**Trade-off**:
- **Pro**: Stateless authentication, scalable, secure
- **Con**: More complex than session-based auth
- **Decision**: Industry standard for SPA applications

### 12. No Email Verification

**Assumption**: Users can immediately use their account after registration.

**Trade-off**:
- **Pro**: Faster onboarding, simpler implementation
- **Con**: Potential for fake accounts
- **Decision**: Can add email verification later for production

### 13. No Password Reset

**Assumption**: No password reset functionality implemented.

**Trade-off**:
- **Pro**: Simpler implementation
- **Con**: Users locked out if they forget password
- **Decision**: Can add via email service integration

## Testing

### 14. SQLite for Tests

**Assumption**: Using SQLite for testing instead of MySQL.

**Trade-off**:
- **Pro**: No external dependencies for tests, isolated test environments
- **Con**: Slightly different SQL syntax, not exactly same as production MySQL
- **Decision**: Acceptable trade-off for CI/CD simplicity

### 15. Redis Tests Skipped Locally

**Assumption**: Redis-dependent tests skipped when Redis not available locally.

**Trade-off**:
- **Pro**: Tests run without external dependencies
- **Con**: Some integration tests not run locally
- **Decision**: Redis tests run in CI/CD with Redis service

## Deployment

### 16. No Payment Processing

**Assumption**: Auction settlement is status change only, no real payment.

**Trade-off**:
- **Pro**: Simpler implementation, no PCI compliance
- **Con**: Not a complete auction platform
- **Decision**: Can integrate Stripe/PayPal later

### 17. Image URLs Only

**Assumption**: Accepting image URLs instead of file upload.

**Trade-off**:
- **Pro**: No file storage complexity, no upload handling
- **Con**: Users must host images elsewhere
- **Decision**: Can add S3/local upload later

### 18. No Real-Time Notifications (Email/SMS)

**Assumption**: Only in-app WebSocket notifications, no email/SMS.

**Trade-off**:
- **Pro**: No third-party service dependencies
- **Con**: Users must be online to receive notifications
- **Decision**: Can integrate SendGrid/Twilio later

## Architecture

### 19. Monolith First

**Assumption**: Starting with modular monolith instead of microservices.

**Trade-off**:
- **Pro**: Simpler deployment, easier development, less infrastructure
- **Con**: Harder to scale individual components
- **Decision**: Modular structure allows decomposition later; premature optimization to avoid

### 20. Docker Compose for Local Development

**Assumption**: Using Docker Compose for local development.

**Trade-off**:
- **Pro**: Consistent environments, easy setup
- **Con**: Requires Docker knowledge, resource overhead
- **Decision**: Docker simplifies onboarding and ensures consistency

## Future Considerations

These assumptions can be revisited for production deployment:

1. Add TypeScript for type safety
2. Implement email verification and password reset
3. Add file upload for bike images
4. Integrate payment processing
5. Add email/SMS notifications
6. Implement caching layer
7. Add comprehensive monitoring (Grafana/Loki)
8. Consider microservices for scale
9. Add database migrations and versioning
10. Implement API versioning
