# TECHNICAL ANNEX: CONTAINERIZATION & PRODUCTION ARCHITECTURE

## 1. Overview
This annex documents the deviation from standard dual-container setups (separate frontend/backend containers) to a unified, single-process architectural pattern using Docker. This approach optimizes resource consumption, eliminates Cross-Origin Resource Sharing (CORS) complexities, and adheres to the "one primary process per container" philosophy without introducing rigid process managers like `supervisord`.

## 2. Architectural Decisions

### 2.1 Unified Frontend/Backend Container
Instead of running Nginx for the frontend and Node.js for the backend in parallel, the architecture has been unified into a single Node.js (Express) process.
- **Mechanism:** The backend Express application serves the pre-compiled static React frontend (Vite `dist`) via `express.static()`.
- **Routing Resolution:** 
  - API requests (prefixed with `/api`) are routed to the Express backend controllers.
  - All other `GET` requests fall back to serving `index.html`, delegating route resolution to React Router in the browser.
- **Middleware Adjustment:** Express v5 introduced strict wildcard regex rules (`path-to-regexp` v8). To prevent `PathError: Missing parameter name`, the generic catch-all route `app.get('*', ...)` was refactored into a native `app.use()` middleware interceptor.

### 2.2 Database Isolation
Despite the app unification, the database was deliberately kept in an isolated container.
- **Reasoning:** Merging PostgreSQL into the Node.js container (Monolithic Container Anti-pattern) risks severe data loss during image rebuilds and prevents horizontal scaling.
- **Implementation:** `docker-compose.yml` mounts a dedicated persistent volume (`postgres_data`) and exposes the database only to the internal Docker network.

### 2.3 Build Process (Dockerfile.unified)
A Multi-stage Docker build is utilized to minimize image size and eliminate build-time dependencies from the production image.
- **Stage 1 (Frontend Build):** Uses `node:20-bookworm-slim`. Installs dependencies and builds the Vite React application.
- **Stage 2 (Production App):** Uses `node:20-bookworm-slim`.
  - Installs `openssl` (required by Prisma on Debian 12).
  - Installs backend dependencies.
  - Generates Prisma client.
  - Copies the built frontend from Stage 1 into the backend's static delivery path (`/app/frontend/dist`).
- **Initialization:** The container start command executes `npx prisma db push --accept-data-loss` to auto-migrate the database schema before initiating the Node server.

## 3. Deployment Instructions
To spin up the production environment from scratch:
1. Ensure Docker and Docker Compose are installed.
2. Execute `docker compose up -d --build`.
3. The application will be exposed on port `80` (HTTP).
4. Run the initial database seed if required (e.g., `docker exec <container_name> node seed.js`) to establish the root administrator.
