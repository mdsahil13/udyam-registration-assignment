# Openbiz Assignment-2 — Udyam Steps 1 & 2 (Aadhaar+OTP, PAN)

This project mirrors the **first two steps** of the Udyam Registration flow (Aadhaar + OTP validation, and PAN validation) with:
- **Scraper** to extract a JSON schema of fields
- **Frontend** (React + Vite + TypeScript) that renders the UI dynamically from the JSON schema
- **Backend** (Express + Prisma + PostgreSQL) to validate and store submissions
- **Tests** (Jest + Supertest) for validation logic and API endpoints
- **Docker Compose** for Postgres and Backend

> Educational/demo only — no real Aadhaar/PAN services are called. OTP is simulated for local development.

## 1) Prerequisites
- Node.js 18+
- npm (or pnpm/yarn)
- Docker Desktop **or** a local PostgreSQL
- VS Code

## 2) Quick Start (All-in-one)
```bash
# 1. Start Postgres + Backend via Docker (first time takes longer)
docker compose up -d --build

# 2. Run DB migrations (creates tables)
cd server
npx prisma migrate dev --name init
cd ..

# 3. Install client deps and start UI
cd client
npm install
npm run dev
# => open http://localhost:5173
```

The UI calls the backend at `http://localhost:4000` (change in `client/src/config.ts`).

## 3) Run the scraper (optional but recommended)
The scraper tries to open the government site and extract field info for Steps 1 & 2. 
If it fails (site blocks bots / requires JS), the frontend will still work using the bundled `client/src/schema.json`.

```bash
cd scraper
npm install
node scrape.js    # writes schema.json into ./out/schema.json
# copy it for the frontend:
cp out/schema.json ../client/src/schema.json
```

## 4) Testing
```bash
# Backend tests
cd server
npm test
```

## 5) Environment
Create `server/.env` from `.env.example` (Docker compose already matches defaults):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/udyam?schema=public"
PORT=4000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

## 6) Notes
- **OTP is simulated** — the backend returns the OTP in dev to make local testing easy.
- **Validation**: Aadhaar = 12 digits; PAN = `[A-Z]{5}[0-9]{4}[A-Z]{1}` (case-insensitive in UI, normalized to upper).
- **Schema-driven UI**: Edit `client/src/schema.json` to add/change fields and labels without touching React components.
