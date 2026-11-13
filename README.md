# AccessMap Nairobi API

A REST API for accessibility information about venues across Nairobi — hospitals, markets, schools, banks, and more. It records which venues have ramps, lifts, accessible toilets, and other features, and it collects community reports and star ratings from visitors. All responses are JSON.

It is built for developers whose apps need to know whether a place is physically accessible, and it powers the AccessMap Nairobi web app also in this repository.

|                                         |                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Live API**                            | <https://accessmap-nairobi-api-1.onrender.com>                                               |
| **Interactive docs (Swagger UI)**       | <https://natasherr.github.io/accessmap-nairobi-api/docs/>                                   |
| **OpenAPI contract**                    | [`openapi.yaml`](openapi.yaml)                                                               |
| **Default branch**                      | `develop`                                                                                    |

> **Free-tier cold start** — the live API runs on a free Render instance and goes to sleep when idle. The first request after a quiet period can take 30–60 seconds. Wait for it, or press `Ctrl+C` and retry.

---

## Table of contents

1. [Quickstart (curl)](#quickstart)
2. [Repository layout](#repository-layout)
3. [Prerequisites](#prerequisites)
4. [Run the API locally](#run-the-api-locally)
5. [Run the web app locally](#run-the-web-app-locally)
6. [Environment variables](#environment-variables)
7. [Authentication](#authentication)
8. [Rate limiting](#rate-limiting)
9. [API versioning](#api-versioning)
10. [Endpoints — v2 (current)](#endpoints--v2-current)
11. [Endpoints — v1 (deprecated)](#endpoints--v1-deprecated)
12. [Partner API proxy](#partner-api-proxy)
13. [Request monitoring](#request-monitoring)
14. [Running tests](#running-tests)
15. [Accessibility fields reference](#accessibility-fields-reference)
16. [Error format](#error-format)

---

## Quickstart

Paste this in any terminal to confirm the live API is responding:

```bash
curl https://accessmap-nairobi-api-1.onrender.com/api/venues/kenyatta-national-hospital
```

**Windows PowerShell users:** use `curl.exe` — the PowerShell built-in `curl` alias is `Invoke-WebRequest` and behaves differently.

```powershell
curl.exe https://accessmap-nairobi-api-1.onrender.com/api/venues/kenyatta-national-hospital
```

Expected `200 OK` response:

```json
{
  "id": "v_001",
  "slug": "kenyatta-national-hospital",
  "name": "Kenyatta National Hospital",
  "area": "Upper Hill",
  "address": "Hospital Rd, Nairobi",
  "category": "hospital",
  "isCivic": false,
  "accessibility": {
    "ramp": true,
    "lift": true,
    "accessibleToilet": true,
    "accessibleParking": true,
    "tactilePaving": false,
    "wideCorridors": true,
    "audioAssistance": false,
    "staffAssistance": true
  },
  "coordinates": { "lat": -1.3004, "lng": 36.8073 },
  "addedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## Repository layout

```
accessmap-nairobi-api/
├── server/                 Express + PostgreSQL API
│   ├── index.js            Entry point — starts the HTTP server
│   ├── app.js              Express app, middleware, route mounts
│   ├── db.js               pg connection pool
│   ├── middleware.js        Auth, public-route allow-list
│   ├── ratelimiter.js       In-memory rate limiter
│   ├── monitoring.js        Request logger + /api/stats handler
│   ├── partner.js           Partner API helpers
│   ├── resilientFetch.js    Retry/timeout wrapper for upstream calls
│   ├── deprecate.js         Deprecation header middleware (v1)
│   ├── flaky-partner.js     Local flaky-server simulator for resilience drills
│   ├── traffic.js           Lab traffic-generation script
│   ├── routes/
│   │   ├── venues.js        Legacy /api/venues routes (alias to v1)
│   │   ├── v1.js            Frozen v1 venue routes — DO NOT EDIT
│   │   ├── v2.js            Current v2 venue routes
│   │   ├── reports.js       /api/reports routes
│   │   └── partner.js       /api/partner proxy routes
│   ├── schema/
│   │   └── schema.sql       SQL to create all tables (run once)
│   └── __tests__/           Jest test suites
├── client/                 React + Vite + Tailwind CSS web app
│   ├── src/
│   │   ├── config/api.js    API base URL config
│   │   ├── pages/           Home, Directory, VenueDetail, ReportForm, About
│   │   └── components/      Shared UI components
│   └── vite.config.js       Reads API_URL from server/.env at build time
├── docs/                   Swagger UI static page (GitHub Pages)
├── openapi.yaml            Full OpenAPI 3.0 contract
├── .env.example            Template for server/.env — copy and fill in
└── vercel.json             Client SPA rewrite rule for Vercel deploys
```

> **Note:** `server.js` at the repository root belongs to a retired earlier version and is **not used**. Run everything from the `server/` folder.

---

## Prerequisites

| Tool | Minimum version | Notes |
| ---- | --------------- | ----- |
| Node.js | 18 | <https://nodejs.org/> |
| npm | bundled with Node | |
| Git | any recent | <https://git-scm.com/> |
| PostgreSQL database | 14+ | Local install **or** a free hosted instance such as [Supabase](https://supabase.com/) |

---

## Run the API locally

### 1. Clone the repository

```bash
git clone -b develop https://github.com/natasherr/accessmap-nairobi-api.git
cd accessmap-nairobi-api
```

### 2. Install server dependencies

All server commands run from the `server/` folder:

```bash
cd server
npm install
```

### 3. Create `server/.env`

Copy the template:

```bash
# from the repository root
cp .env.example server/.env
```

Then open `server/.env` and fill in **all required values**:

```dotenv
# PostgreSQL connection string — main app database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

# PostgreSQL connection string — separate test database (used by Jest only)
TEST_DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE_test

# Port the server listens on (Render sets this automatically in production)
PORT=5000

# API key(s) for protected endpoints — comma-separated for multiple consumers
# Generate a random key: node -e "console.log(require('crypto').randomUUID())"
API_KEY=replace-with-generated-api-key

# Partner API (Voter Edu — Group 11) — base URL including /api
PARTNER_URL=https://voter-edu-backend.onrender.com/api
PARTNER_API_KEY=replace-with-your-private-group-11-key

# Partner API version ("v1" or "v2")
PARTNER_VERSION=v1

# Leave false in normal operation — only set true for explicit partner write tests
ALLOW_PARTNER_WRITES=false

# API origin used by the frontend build and traffic.js (no trailing /api)
API_URL=https://accessmap-nairobi-api-1.onrender.com
```

> **Special characters in passwords** — if your PostgreSQL password contains `#`, `@`, or `%`, URL-encode them (`#` → `%23`, `@` → `%40`, `%` → `%25`). Otherwise the connection string parser will misread the URL.

> **Network note** — many campus Wi-Fi networks block outbound connections on port 5432 (PostgreSQL). If the server cannot reach a hosted database, try a phone hotspot.

### 4. Create the database tables

Run [`server/schema/schema.sql`](server/schema/schema.sql) against your empty database **once**:

**Supabase:** paste the file contents into the SQL Editor and click Run.

**Local PostgreSQL:**

```bash
psql -d YOUR_DATABASE_NAME -f schema/schema.sql
```

This creates two tables: `Venue` and `Report`.

### 5. Start the server

```bash
# from server/
npm start
```

For development with auto-restart on file changes:

```bash
npm run dev
```

### 6. Verify it is running

```bash
curl http://localhost:5000/
# → AccessMap API is running
```

```bash
curl http://localhost:5000/api/venues
# → [] (empty array — a fresh database has no venues)
```

Add venues using the `POST /api/venues` examples in the [Endpoints](#endpoints--v2-current) section below, using `http://localhost:5000` as the base URL.

---

## Run the web app locally

The `client/` folder is a standalone Vite + React + Tailwind app. It reads `API_URL` from `server/.env` at **build time** (via [`client/vite.config.js`](client/vite.config.js)) and falls back to the deployed API origin if that variable is not set.

```bash
# from the repository root
cd client
npm install
npm run dev
```

Open <http://localhost:5173/> in your browser.

| Route | Page |
| ----- | ---- |
| `/` | Home |
| `/directory` | Searchable, filterable venue listing |
| `/venue/:slug` | Venue detail with community reports |
| `/report` | 4-step report submission form |
| `/about` | About |

To point the dev frontend at your local API instead of the deployed one, set `API_URL=http://localhost:5000` in `server/.env` and restart `npm run dev`.

To build for production:

```bash
npm run build
# output goes to client/dist/
```

---

## Environment variables

All variables live in `server/.env`. The file is gitignored — never commit it.

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string for the running server |
| `TEST_DATABASE_URL` | ✅ (for tests) | Separate PostgreSQL database used by Jest. Required if running `npm test`. The server refuses to use `DATABASE_URL` for test runs to prevent pollution. |
| `PORT` | optional | HTTP port (default `5000`). Render sets this automatically. |
| `API_KEY` | ✅ | Comma-separated API key(s) for protected endpoints |
| `PARTNER_URL` | ✅ (for partner features) | Voter Edu API base URL **including** `/api` |
| `PARTNER_API_KEY` | ✅ (for partner features) | Private key for the upstream partner API — never sent to the browser |
| `PARTNER_VERSION` | optional | `v1` or `v2` (default `v1`) |
| `ALLOW_PARTNER_WRITES` | optional | Set `true` only to enable partner write tests (`npm run test:partner`) |
| `API_URL` | optional | API origin used by the frontend build and `traffic.js` (no `/api` suffix). Falls back to the deployed URL. |

---

## Authentication

| Endpoint category | How to call it |
| ----------------- | -------------- |
| `GET /` health check | No header required |
| `GET /api/venues`, `GET /api/venues/:slug`, `GET /api/venues/:slug/rating`, `GET /api/venues/:slug/reports`, `GET /api/reports` | No header required (public reads) |
| `GET /api/partner/rallies` | No header required (public read) |
| All versioned GET equivalents (`/v1/…`, `/v2/…`) | No header required |
| `POST /api/venues` (or `/v1/…`, `/v2/…`), `POST /api/reports` | **Required**: `am-api-key: <your-key>` |
| `GET /api/stats` | **Required**: `am-api-key: <your-key>` |
| `POST /api/partner/rallies/:rallyId/comments` | Public (rate-limited to 5/min per IP; backend forwards securely with `PARTNER_API_KEY`) |

Send the key in the `am-api-key` request header:

```bash
curl -X POST https://accessmap-nairobi-api-1.onrender.com/api/venues \
  -H "am-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d @venue.json
```

**Generate a fresh key** (run once, store the output in `API_KEY` in `server/.env`):

```bash
node -e "console.log(require('crypto').randomUUID())"
```

Never put API keys in frontend code or commit them to the repository.

### 401 Unauthorized

Header missing:

```json
{ "error": "API Key not found" }
```

Header present but wrong value:

```json
{ "error": "API Key does not match" }
```

---

## Rate limiting

| Request type | Limit |
| ------------ | ----- |
| Public reads (by client IP) | 100 requests / minute |
| API-key requests (by key) | 100 requests / minute |
| Rally feedback `POST` (by client IP) | 5 requests / minute |

When the limit is exceeded:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{ "error": "Too many requests", "retryAfter": 60 }
```

Wait `retryAfter` seconds before retrying.

---

## API versioning

Two versions of the venue endpoints are live simultaneously:

| Version | Base path | Status |
| ------- | --------- | ------ |
| v1 | `/api/venues` and `/v1/venues` | **Deprecated** — sends `Deprecation` and `Sunset` headers. Still functional but may be removed at any time. |
| v2 | `/v2/venues` | **Current** — use this for all new integrations |

### Breaking change in v2

`GET /v2/venues` returns a wrapped envelope instead of a bare array:

```json
{ "data": [ ...venues... ], "count": 42 }
```

All other endpoint shapes (single venue, rating, reports, POST body/response) are identical between v1 and v2.

### Migration from v1 to v2

```js
// v1 — bare array
const venues = await fetch(`${API_BASE}/api/venues?category=market`).then(r => r.json());

// v2 — wrapped envelope
const { data: venues } = await fetch(`${API_BASE}/v2/venues?category=market`).then(r => r.json());
```

`POST /api/reports` does **not** move — it remains at `/api/reports` in both versions.

---

## Endpoints — v2 (current)

Use `/v2/venues` for all new integrations. The `/api/reports` path is unchanged.

| # | Method | Path | Auth required | Success |
| - | ------ | ---- | :-----------: | ------- |
| 1 | `GET` | `/v2/venues` | ❌ | `200` |
| 2 | `GET` | `/v2/venues/{slug}` | ❌ | `200` |
| 3 | `GET` | `/v2/venues/{slug}/rating` | ❌ | `200` |
| 4 | `GET` | `/v2/venues/{slug}/reports` | ❌ | `200` |
| 5 | `POST` | `/v2/venues` | ✅ | `201` |
| 6 | `POST` | `/api/reports` | ✅ | `201` |

Send `Content-Type: application/json` on every `POST`.

---

### 1. List venues — `GET /v2/venues`

Returns venues wrapped in `{ data, count }`. With no parameters, all venues are returned. Parameters combine with AND.

| Query parameter | Type | Meaning |
| --------------- | ---- | ------- |
| `category` | string | Exact match. Values: `hospital`, `market`, `office`, `school`, `transport`, `bank`, `hotel`, `other` |
| `area` | string | Exact match. Examples: `Westlands`, `Karen`, `CBD`, `Upper Hill`, `Runda` |
| `accessible` | boolean | `true` returns only venues where `ramp`, `accessibleToilet`, **and** `accessibleParking` are all `true`. Any other value returns `400`. |

```bash
curl "https://accessmap-nairobi-api-1.onrender.com/v2/venues?category=hospital&accessible=true"
```

Response `200`:

```json
{
  "count": 1,
  "data": [
    {
      "id": "v_001",
      "slug": "kenyatta-national-hospital",
      "name": "Kenyatta National Hospital",
      "area": "Upper Hill",
      "address": "Hospital Rd, Nairobi",
      "category": "hospital",
      "isCivic": false,
      "accessibility": {
        "ramp": true,
        "lift": true,
        "accessibleToilet": true,
        "accessibleParking": true,
        "tactilePaving": false,
        "wideCorridors": true,
        "audioAssistance": false,
        "staffAssistance": true
      },
      "coordinates": { "lat": -1.3004, "lng": 36.8073 },
      "addedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

No matches returns `200` with `{ "data": [], "count": 0 }`.

---

### 2. Get one venue — `GET /v2/venues/{slug}`

`{slug}` is the `slug` field from any venue object.

```bash
curl https://accessmap-nairobi-api-1.onrender.com/v2/venues/kenyatta-national-hospital
```

Response `200`: a single venue object (same shape as items inside `data` above).

Unknown slug → `404`:

```json
{ "error": "No venue found with the given slug" }
```

---

### 3. Average rating — `GET /v2/venues/{slug}/rating`

```bash
curl https://accessmap-nairobi-api-1.onrender.com/v2/venues/kenyatta-national-hospital/rating
```

Response `200`:

```json
{
  "slug": "kenyatta-national-hospital",
  "averageRating": 4.3,
  "totalReports": 3
}
```

`averageRating` is rounded to one decimal place. A venue with no reports returns `"averageRating": 0` and `"totalReports": 0`.

---

### 4. List reports for a venue — `GET /v2/venues/{slug}/reports`

```bash
curl https://accessmap-nairobi-api-1.onrender.com/v2/venues/kenyatta-national-hospital/reports
```

Response `200`: array of report objects (same shape as the `POST /api/reports` response).

---

### 5. Add a venue — `POST /v2/venues`

The server assigns `id`, `slug`, and `addedAt` — do not include them in the request body.

Save this as `venue.json`:

```json
{
  "name": "Sunrise Pharmacy",
  "area": "Westlands",
  "address": "Mpaka Rd, Westlands, Nairobi",
  "category": "other",
  "accessibility": {
    "ramp": true,
    "lift": false,
    "accessibleToilet": false,
    "accessibleParking": true,
    "tactilePaving": false,
    "wideCorridors": true,
    "audioAssistance": false,
    "staffAssistance": false
  },
  "coordinates": { "lat": -1.2676, "lng": 36.8062 }
}
```

All top-level fields are required. All eight `accessibility` values must be booleans. `coordinates.lat` and `coordinates.lng` must be numbers.

```bash
curl -X POST https://accessmap-nairobi-api-1.onrender.com/v2/venues \
  -H "am-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d @venue.json
```

Response `201` (`id` and `addedAt` will differ):

```json
{
  "id": "v_035",
  "slug": "sunrise-pharmacy",
  "name": "Sunrise Pharmacy",
  "area": "Westlands",
  "address": "Mpaka Rd, Westlands, Nairobi",
  "category": "other",
  "isCivic": false,
  "accessibility": {
    "ramp": true,
    "lift": false,
    "accessibleToilet": false,
    "accessibleParking": true,
    "tactilePaving": false,
    "wideCorridors": true,
    "audioAssistance": false,
    "staffAssistance": false
  },
  "coordinates": { "lat": -1.2676, "lng": 36.8062 },
  "addedAt": "2026-10-06T09:15:42.118Z"
}
```

Duplicate name + area → `409 Conflict`:

```json
{
  "error": "A venue with this name already exists in this area.",
  "existing": { "...": "the existing venue object" }
}
```

---

### 6. Submit a report — `POST /api/reports`

`venueId` must be the `id` of an existing venue (e.g. `"v_035"` from the POST response above).

Save this as `report.json`, replacing `VENUE_ID` with the actual id:

```json
{
  "venueId": "VENUE_ID",
  "rating": 4,
  "description": "Ramp at the entrance and helpful staff.",
  "visitedAt": "2026-10-01",
  "accessibility": {
    "ramp": true,
    "lift": false,
    "accessibleToilet": false,
    "accessibleParking": true,
    "tactilePaving": false,
    "wideCorridors": true,
    "audioAssistance": false,
    "staffAssistance": true
  }
}
```

| Field | Rules |
| ----- | ----- |
| `venueId` | Required string — must match an existing venue `id` |
| `rating` | Required integer from `1` to `5` |
| `visitedAt` | Required date string in `YYYY-MM-DD` format |
| `description` | Optional string |
| `accessibility` | Required — all eight values must be booleans |

```bash
curl -X POST https://accessmap-nairobi-api-1.onrender.com/api/reports \
  -H "am-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d @report.json
```

Response `201`:

```json
{
  "id": "r_034",
  "venueId": "v_035",
  "rating": 4,
  "description": "Ramp at the entrance and helpful staff.",
  "visitedAt": "2026-10-01",
  "submittedAt": "2026-10-06T09:20:11.532Z",
  "accessibility": {
    "ramp": true,
    "lift": false,
    "accessibleToilet": false,
    "accessibleParking": true,
    "tactilePaving": false,
    "wideCorridors": true,
    "audioAssistance": false,
    "staffAssistance": true
  }
}
```

`description` is omitted from the response when you did not send it.

---

## Endpoints — v1 (deprecated)

> ⚠️ **v1 is deprecated.** It sends `Deprecation` and `Sunset` headers. Use [v2](#endpoints--v2-current) for all new code. The `/api/venues` path is kept alive as a legacy alias.

| Method | v1 path | v2 equivalent |
| ------ | ------- | ------------- |
| `GET` | `/api/venues` or `/v1/venues` | `GET /v2/venues` |
| `GET` | `/api/venues/:slug` or `/v1/venues/:slug` | `GET /v2/venues/:slug` |
| `GET` | `/api/venues/:slug/rating` | `GET /v2/venues/:slug/rating` |
| `GET` | `/api/venues/:slug/reports` | `GET /v2/venues/:slug/reports` |
| `POST` | `/api/venues` or `/v1/venues` | `POST /v2/venues` |

The only breaking change is that `GET /v2/venues` returns `{ data, count }` instead of a bare array.

---

## Partner API proxy

The server proxies selected routes from the Voter Edu partner API (Group 11) so the partner key never reaches the browser.

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET` | `/api/partner/rallies` | Public | Lists upcoming rallies. Responses are cached in memory; if the upstream is unavailable, the last known good data is returned with `stale: true`. |
| `GET` | `/api/partner/candidates` | Public | Lists candidates. |
| `GET` | `/api/partner/transport/landmarks` | Public | Lists transport landmarks. |
| `POST` | `/api/partner/rallies/:rallyId/comments` | Public (5/min rate limit) | Forwards an accessibility/congestion feedback comment to the partner API. Not retried — to avoid duplicate submissions if the partner receives the request but its response is lost. |

### Rally feedback fields

| Field | Required | Type | Rules |
| ----- | -------- | ---- | ----- |
| `comment` | ✅ | string | 1–2000 characters |
| `user` | ❌ | string | Up to 80 characters |
| `accessible` | ❌ | boolean or 0/1 | `true`, `false`, `0`, or `1` |
| `congestion_level` | ❌ | string | `Low`, `Medium`, or `Extreme` |

### Upstream resilience

- Partner GET requests use a **1.5-second per-attempt timeout**, at most **2 retries**, and in-memory last-known-good data where available.
- The rallies endpoint marks fallback responses with `stale: true` and an `asOf` timestamp.
- Run the focused resilience tests: `npm run test:resilience` from `server/`.
- To run a local flaky-partner drill: `npm run demo:partner` (starts the mock server) — see [`RESILIENCE_NOTES.md`](RESILIENCE_NOTES.md).
- Live partner contract tests: `npm run test:partner` (writes disabled unless `ALLOW_PARTNER_WRITES=true`).

---

## Request monitoring

The server writes one JSON log line per completed request: timestamp, method, path (no query string), status, response time in ms, and either `none` or a short fingerprint of a valid API key. Request/response bodies and raw keys are never logged.

### `GET /api/stats`

Returns in-memory counters since the last server restart. Requires `am-api-key`.

```powershell
curl.exe -H "am-api-key: YOUR_KEY" http://localhost:5000/api/stats
```

```json
{
  "startedAt": "2026-11-04T06:00:00.000Z",
  "uptimeSeconds": 120,
  "total": 10,
  "clientErrors": 2,
  "serverErrors": 0,
  "errorRatePercent": 0,
  "avgMs": 8.4,
  "routes": {
    "GET /api/venues": {
      "count": 4,
      "clientErrors": 0,
      "serverErrors": 0,
      "avgMs": 6.1,
      "maxMs": 9.2
    }
  }
}
```

### Traffic generation script

Put `API_URL` and `API_KEY` in `server/.env`, then run from `server/`:

```bash
node traffic.js
```

The script sends read-only requests including one missing-key request. Keep `requests.log` local — `*.log` files are gitignored.

---

## Running tests

All test commands run from the `server/` folder.

### Prerequisites for tests

- `TEST_DATABASE_URL` must be set in `server/.env` pointing to a **separate** seeded test database. The server will refuse to run tests against `DATABASE_URL`.
- The test database must be empty or contain only the fixtures expected by the tests.

```bash
cd server
```

| Command | What it runs |
| ------- | ------------ |
| `npm test` | All Jest unit + integration tests |
| `npm run test:resilience` | Focused partner-resilience tests only |
| `npm run test:partner` | Live partner API contract tests (set `ALLOW_PARTNER_WRITES=true` to enable write tests) |
| `npm run demo:partner` | Starts the local flaky-partner simulator for manual resilience drills |

Test files are in [`server/__tests__/`](server/__tests__/) and cover venues, reports, middleware, rate limiter, monitoring, partner resilience, resilient fetch, and API versioning.

---

## Accessibility fields reference

Every venue and report carries an `accessibility` object with these eight boolean fields:

| Field | `true` means |
| ----- | ------------ |
| `ramp` | Ramp or step-free entry exists |
| `lift` | Lift or elevator present |
| `accessibleToilet` | Accessible toilet available |
| `accessibleParking` | Accessible parking bays available |
| `tactilePaving` | Tactile paving for visually impaired visitors |
| `wideCorridors` | Corridors wide enough for wheelchairs |
| `audioAssistance` | Audio assistance or announcements available |
| `staffAssistance` | Staff trained to assist people with disabilities |

Timestamps (`addedAt`, `submittedAt`) are ISO 8601 in UTC. `visitedAt` is a plain `YYYY-MM-DD` date string.

---

## Error format

Every error response is a JSON object with an `error` key:

```json
{ "error": "rating is required and must be an integer from 1 to 5" }
```

| Status | Meaning | Notes |
| ------ | ------- | ----- |
| `400 Bad Request` | A required field is missing or has the wrong type. Nothing was saved. | |
| `401 Unauthorized` | API key missing or invalid | |
| `404 Not Found` | Slug or `venueId` does not match any venue | |
| `409 Conflict` | Duplicate venue (same `name` + `area`). Response includes an `existing` field. | |
| `429 Too Many Requests` | Rate limit exceeded. `Retry-After` header and `retryAfter` field tell you how many seconds to wait. | |
| `502 Bad Gateway` | Upstream partner API returned an error or is unreachable | |
| `503 Service Unavailable` | Partner API is not configured in the environment | |
| `500 Internal Server Error` | Unexpected server failure | |

Common `400` messages:

```
name is required and must be a string
area is required and must be a string
address is required and must be a string
category is required and must be a string
accessibility object is required
accessibility.ramp must be a boolean
coordinates.lat and coordinates.lng are required numbers
venueId is required and must be a string
visitedAt is required and must be a date string
accessible must be a boolean (true or false)
```

---

## License

This project is licensed under the [MIT License](LICENSE).

Built with ❤️ for Nairobi
