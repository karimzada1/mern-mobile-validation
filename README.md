# MERN Mobile Validation — Item Manager

A full-stack application demonstrating a microservice architecture with mobile number validation, built with React, Node.js, Express, and MongoDB.

---

## Project Structure

```
├── mobile-validation-service/   # Microservice — validates phone numbers (port 3001)
├── backend/                     # REST API — Item & Category CRUD (port 5000)
├── frontend/                    # React SPA (port 5173 in dev, 80 in Docker)
├── docker-compose.yml           # One-command full-stack launch
└── README.md
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | bundled with Node |
| MongoDB | 7+ | https://www.mongodb.com/try/download/community |
| Docker (optional) | 24+ | https://docs.docker.com/get-docker/ |

---

## Running Locally (without Docker)

### 1. Mobile Validation Microservice

```bash
cd mobile-validation-service
cp .env.example .env          # edit to add your NUMVERIFY_API_KEY (optional)
npm install
npm run dev                   # starts on http://localhost:3001
```

> **NUMVERIFY_API_KEY** is optional. Without it, the service still validates number format and returns country info but `operatorName` will be `"Unknown"`. Get a free key at https://numverify.com (100 req/month).

### 2. Backend

```bash
cd backend
cp .env.example .env          # ensure MONGO_URI and VALIDATION_SERVICE_URL are correct
npm install
npm run dev                   # starts on http://localhost:5000
```

Make sure MongoDB is running locally first (`mongod`).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # starts on http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## Running with Docker (Bonus Task 5)

```bash
# From the project root
docker compose up --build
```

This starts all four services (MongoDB, microservice, backend, frontend). Open http://localhost in your browser.

To pass your Numverify API key:

```bash
NUMVERIFY_API_KEY=your_key_here docker compose up --build
```

---

## API Documentation

### Mobile Validation Microservice — `http://localhost:3001`

#### `POST /validate`
Validates a mobile phone number and returns its details.

**Request body:**
```json
{ "mobile": "+12025551234" }
```

**Response — valid number:**
```json
{
  "valid": true,
  "countryCode": "+1",
  "countryName": "United States of America",
  "operatorName": "AT&T Mobility LLC"
}
```

**Response — invalid number:**
```json
{
  "valid": false,
  "error": "Invalid number"
}
```

#### `GET /health`
```json
{ "status": "ok", "service": "mobile-validation" }
```

---

### Backend REST API — `http://localhost:5000`

#### Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | Get all items |
| POST | `/api/items` | Add a new item |
| PUT | `/api/items/:id` | Update item by ID |
| DELETE | `/api/items/:id` | Delete item by ID |

**POST /api/items — Request body:**
```json
{
  "name": "Laptop",
  "description": "A powerful laptop",
  "mobileNumber": "+12025551234",
  "categoryId": "64abc..."
}
```
`mobileNumber` and `categoryId` are optional. If `mobileNumber` is provided, the backend calls the validation microservice. An invalid number returns HTTP 400.

**GET /api/items — Response:**
```json
[
  {
    "_id": "64abc...",
    "name": "Laptop",
    "description": "A powerful laptop",
    "mobileNumber": "+12025551234",
    "mobileDetails": {
      "countryCode": "+1",
      "countryName": "United States of America",
      "operatorName": "AT&T Mobility LLC"
    },
    "category": { "_id": "64xyz...", "name": "Electronics" },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Categories (Bonus Task 4)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create a category |
| PUT | `/api/categories/:id` | Update category by ID |
| DELETE | `/api/categories/:id` | Delete category by ID |

**POST /api/categories — Request body:**
```json
{ "name": "Electronics" }
```

---

## Running Tests

### Microservice tests
```bash
cd mobile-validation-service
npm test
```

### Backend tests
```bash
cd backend
npm test
```

The backend tests use an **in-memory MongoDB** (`mongodb-memory-server`) — no running MongoDB required. The mobile validation service is **mocked** with Jest so tests run without external network calls.

**What is covered:**
- Validation service: valid/invalid number detection, missing body, health endpoint
- Items: full CRUD, 404 for unknown IDs, mobile validation (valid, invalid, service down), clearing a mobile number, category association
- Categories: full CRUD, 404 for unknown IDs, duplicate name handling

---

## Code Quality Notes

### What is efficient / well-designed

- **Microservice isolation** — `mobile-validation-service` is fully independent. It can be deployed, scaled, or replaced without touching the backend. The backend only knows its HTTP contract.
- **Layered mobile validation** — `libphonenumber-js` does a fast local format check first; the external API call only happens for structurally valid numbers. This avoids unnecessary API quota usage.
- **Central error handler** in `backend/src/index.js` — async errors in routes bubble up cleanly without duplicating try/catch in every handler.
- **In-memory MongoDB for tests** (`mongodb-memory-server`) — tests are fully isolated, fast, and require no external setup.
- **Mocked axios in item tests** — the validation service dependency is faked, so backend tests are deterministic and don't flake due to network.

### What should be improved with more time

- **Authentication** — currently there is no auth. In production, add JWT middleware before all write routes.
- **Input sanitization** — basic `trim()` is applied, but there is no XSS sanitization or length limits. A library like `express-validator` or `zod` should validate and sanitize all inputs.
- **Pagination** — `GET /api/items` returns all documents. With large datasets this will be slow; add `?page=&limit=` parameters and `skip/limit` in Mongoose.
- **Rate limiting** — the validation microservice exposes the numverify API key cost. Add `express-rate-limit` to prevent abuse.
- **Error logging** — `console.error` is used throughout. A structured logger (e.g. `pino` or `winston`) with log levels should be used in production.
- **numverify free tier** — only 100 requests/month. For production, consider a paid plan or switch to a different carrier-lookup provider.
- **Frontend state management** — simple `useState/useEffect` is fine for this scale. For a larger app, React Query or Zustand would simplify data fetching and caching.
- **Tests for frontend** — the frontend has no automated tests. Adding Vitest + React Testing Library would cover the component layer.
