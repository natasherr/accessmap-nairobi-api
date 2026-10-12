# AccessMap Nairobi API

A REST API for accessibility information about venues across Nairobi: hospitals, markets, schools, banks and more. It tells you which venues have ramps, lifts, accessible toilets and other features, and it collects community reports and star ratings from visitors. All responses are JSON.

It is built for developers whose apps need to know whether a place is physically accessible, and it powers the AccessMap Nairobi web app in this repository.

|                                         |                                                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Live API**                      | `https://accessmap-nairobi-api-1.onrender.com`                                                                  |
| **Interactive docs (Swagger UI)** | [https://natasherr.github.io/accessmap-nairobi-api/docs/](https://natasherr.github.io/accessmap-nairobi-api/docs/) |
| **Contract**                      | [`openapi.yaml`](openapi.yaml)                                                                                   |

All example commands below use the live API address. On Windows PowerShell, type `curl.exe` instead of `curl` (plain `curl` is a different command there). Responses are shown formatted for readability; the real output is a single line.

---

## Quickstart

Copy, paste, run:

```bash
curl https://accessmap-nairobi-api-1.onrender.com/api/venues/kenyatta-national-hospital
```

You should get `200 OK` with:

```json
{
  "id": "v_001",
  "slug": "kenyatta-national-hospital",
  "name": "Kenyatta National Hospital",
  "area": "Upper Hill",
  "address": "Hospital Rd, Nairobi",
  "category": "hospital",
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

**If the request hangs:** the live API runs on a free tier and goes to sleep when idle. The first request after a quiet period can take 30 to 60 seconds. Wait for it, or press Ctrl+C and run the command again.

---

## Authentication

None. Every endpoint is open and needs no key or token.

API keys for the write endpoints (`POST`) are planned. When they are added, this section will document the header to send.

---

## Endpoints

| # | Method   | Path                          | What it does                          | Success |
| - | -------- | ----------------------------- | ------------------------------------- | ------- |
| 1 | `GET`  | `/api/venues`               | List venues, optionally filtered      | `200` |
| 2 | `GET`  | `/api/venues/{slug}`        | Get one venue by slug                 | `200` |
| 3 | `GET`  | `/api/venues/{slug}/rating` | Average star rating for a venue       | `200` |
| 4 | `POST` | `/api/venues`               | Add a new venue                       | `201` |
| 5 | `POST` | `/api/reports`              | Submit a community report for a venue | `201` |

Send `Content-Type: application/json` on every `POST`.

### 1. List venues: `GET /api/venues`

Returns an array of venues. With no parameters it returns every venue. Parameters combine with AND.

| Parameter      | Type    | Meaning                                                                                                                          |
| -------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `category`   | string  | Exact, case-sensitive match. Values in use:`hospital`, `market`, `office`, `school`, `transport`, `bank`, `other`  |
| `area`       | string  | Exact, case-sensitive match, for example`Westlands`, `Karen`, `CBD`, `Upper Hill`                                        |
| `accessible` | boolean | `true` returns only venues that have a ramp, an accessible toilet **and** accessible parking. Any other value is ignored |

Request:

```bash
curl "https://accessmap-nairobi-api-1.onrender.com/api/venues?category=hotel&area=Runda"
```

Response `200`:

```json
[
  {
    "id": "v_034",
    "slug": "glee-hotel",
    "name": "Glee hotel ",
    "area": "Runda",
    "address": "Northern Bypass Nairobi -Off Limuru rd",
    "category": "hotel",
    "accessibility": {
      "ramp": false,
      "lift": false,
      "accessibleToilet": false,
      "accessibleParking": false,
      "tactilePaving": false,
      "wideCorridors": false,
      "audioAssistance": false,
      "staffAssistance": false
    },
    "coordinates": {
      "lat": -1.2921,
      "lng": 36.8219
    },
    "addedAt": "2026-09-04T07:19:46.667Z"
  }
]
```

If nothing matches, you get `200` with an empty array `[]`, not an error.

### 2. Get one venue: `GET /api/venues/{slug}`

`{slug}` is the venue's `slug` field from the list endpoint. The quickstart above is this endpoint.

Response `200`: a single venue object, as shown in the Quickstart.

Unknown slug, `404`:

```bash
curl https://accessmap-nairobi-api-1.onrender.com/api/venues/no-such-venue
```

```json
{ "error": "No venue found with the given slug" }
```

### 3. Average rating: `GET /api/venues/{slug}/rating`

Request:

```bash
curl https://accessmap-nairobi-api-1.onrender.com/api/venues/kenyatta-national-hospital/rating
```

Response `200`:

```json
{
  "slug": "kenyatta-national-hospital",
  "averageRating": 4.3,
  "totalReports": 3
}
```

`averageRating` is rounded to one decimal place. A venue with no reports returns `"averageRating": 0` and `"totalReports": 0`. Unknown slug returns `404` with the error format below.

### 4. Add a venue: `POST /api/venues`

Creates a real record. The server assigns `id` and `slug`; you do not send them.

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

All fields are required. All eight `accessibility` values must be booleans, and `coordinates.lat` and `coordinates.lng` must be numbers.

Request:

```bash
curl -X POST https://accessmap-nairobi-api-1.onrender.com/api/venues -H "Content-Type: application/json" -d @venue.json
```

Response `201` (your `id` and `addedAt` will differ):

```json
{
  "id": "v_034",
  "slug": "sunrise-pharmacy",
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
  "coordinates": { "lat": -1.2676, "lng": 36.8062 },
  "addedAt": "2026-10-06T09:15:42.118Z"
}
```

**Run it twice and you get `409 Conflict`.** A venue with the same `name` and `area` cannot be added again. The response includes the venue that already exists:

```json
{
  "error": "A venue with this name already exists in this area.",
  "existing": { "...": "the existing venue, same shape as the 201 response" }
}
```

To add another one, change `name` in `venue.json`. Note the `id` in the response: you need it for the next step.

### 5. Submit a report: `POST /api/reports`

A report is one visitor's rating and observations for one venue. `venueId` must be the `id` of a venue that already exists, taken from a previous response (you cannot invent one).

Save this as `report.json`, replacing `REPLACE_WITH_ID_FROM_STEP_4` with the `id` you got back in step 4 (for example `v_034`):

```json
{
  "venueId": "REPLACE_WITH_ID_FROM_STEP_4",
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

| Field             | Rules                                               |
| ----------------- | --------------------------------------------------- |
| `venueId`       | Required string. Must match an existing venue`id` |
| `rating`        | Required integer from 1 to 5                        |
| `visitedAt`     | Required date string in`YYYY-MM-DD` format        |
| `description`   | Optional string                                     |
| `accessibility` | Required. All eight values must be booleans         |

Request:

```bash
curl -X POST https://accessmap-nairobi-api-1.onrender.com/api/reports -H "Content-Type: application/json" -d @report.json
```

Response `201` (your `id` and `submittedAt` will differ):

```json
{
  "id": "r_033",
  "venueId": "v_034",
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

`description` is left out of the response when you did not send one.

To see the effect, call `GET /api/venues/sunrise-pharmacy/rating` (use the slug from step 4): it now reports `"totalReports": 1`.

---

## Error format

Every error response is a JSON object with an `error` message:

```json
{ "error": "rating is required and must be an integer from 1 to 5" }
```

| Status                        | Meaning                                                              | Example`error`                                        |
| ----------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- |
| `400 Bad Request`           | A required field is missing or has the wrong type. Nothing was saved | `name is required and must be a string`               |
| `404 Not Found`             | The slug or`venueId` does not match any venue                      | `No venue found with the given slug`                  |
| `409 Conflict`              | The venue already exists (adds an`existing` field)                 | `A venue with this name already exists in this area.` |
| `500 Internal Server Error` | Unexpected failure on the server                                     | `Unexpected server error`                             |

Any status below 400 means success. If the `error` key is present, the request failed.

Other `400` messages you may see, one per validation rule:

```
area is required and must be a string
address is required and must be a string
category is required and must be a string
accessibility object is required
accessibility.ramp must be a boolean
coordinates.lat and coordinates.lng are required numbers
venueId is required and must be a string
visitedAt is required and must be a date string
```

---

## Accessibility fields

Every venue and report has an `accessibility` object with these eight boolean values:

| Field                 | `true` means                                   |
| --------------------- | ------------------------------------------------ |
| `ramp`              | Ramp or step-free entry                          |
| `lift`              | Lift or elevator                                 |
| `accessibleToilet`  | Accessible toilet                                |
| `accessibleParking` | Accessible parking                               |
| `tactilePaving`     | Tactile paving for visually impaired visitors    |
| `wideCorridors`     | Corridors wide enough for wheelchairs            |
| `audioAssistance`   | Audio assistance                                 |
| `staffAssistance`   | Staff trained to assist people with disabilities |

Timestamps (`addedAt`, `submittedAt`) are ISO 8601 in UTC. `visitedAt` is a plain `YYYY-MM-DD` date.

---

## Run the API locally

These steps assume a completely clean clone. You need [Node.js](https://nodejs.org/) 18 or newer, [Git](https://git-scm.com/), and a PostgreSQL database you can connect to (a local install, or a free hosted one such as Supabase).

**1. Clone and install.** Run everything from the `server/` folder. The `server.js` at the repository root belongs to a retired earlier version and is not used.

```bash
git clone -b develop https://github.com/natasherr/accessmap-nairobi-api.git
cd accessmap-nairobi-api/server
npm install
```

**2. Create `server/.env`** with your database connection string:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
PORT=5000
```

If your password contains special characters such as `#` or `@`, URL-encode them (`#` becomes `%23`, `@` becomes `%40`), or the connection will fail.

**3. Create the tables.** Run the contents of [`server/schema.sql`](server/schema.sql) in your database. In Supabase, paste it into the SQL Editor. With a local PostgreSQL install, run `psql -d YOUR_DATABASE -f schema.sql`.

**4. Start the server:**

```bash
npm start
```

**5. Check it is running:**

```bash
curl http://localhost:5000/
```

It should print `AccessMap API is running`.

A fresh database has no venues, so `curl http://localhost:5000/api/venues` returns `[]`. Add data with the `POST` examples above, using `http://localhost:5000` as the address. The hosted API already contains 33 seeded Nairobi venues.

Some networks, including many campus Wi-Fi networks, block outbound PostgreSQL connections. If the server cannot reach a hosted database, try a phone hotspot.

### Run the tests

```bash
npm test
```

The tests run against the database in your `.env`, create test venues and reports in it, and expect the 33 seeded venues to be present, so run them against a seeded database.

---

## The web app

The repository also contains the AccessMap Nairobi web app in `client/`, built with React, Vite and Tailwind CSS. It lets people search and filter venues, view accessibility badges and community ratings, get Google Maps directions, share a venue on WhatsApp, print a venue card, and submit a report through a 4-step form.

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173/. The app reads its API address from `API_BASE` in `client/src/context/VenuesContext.jsx` and `client/src/context/ReportsContext.jsx`. For local development, set it to `http://localhost:5000/api`.

| Route            | Page                                 |
| ---------------- | ------------------------------------ |
| `/`            | Home                                 |
| `/directory`   | Searchable, filterable venue listing |
| `/venue/:slug` | Venue detail with community reports  |
| `/report`      | 4-step report form                   |
| `/about`       | About                                |

---

## Repository layout

```
server/        Express + PostgreSQL API (documented above)
client/        React web app
docs/          Swagger UI page, published with GitHub Pages
openapi.yaml   The API contract
```

## Repository layout

---

## License

This project is licensed under the [MIT License](LICENSE).

Built with ❤️ for Nairobi
