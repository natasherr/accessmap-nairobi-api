# Deprecation Notice — AccessMap Nairobi API v1 → v2

**Date:** 4 November 2026
**From:** AccessMap Nairobi (Group 12)
**To:** Kanairo-Klean (Group 13)
**Sunset date:** After Friday 13 November 2026 (Demo Day) — v1 stays live through the presentation

---

## 1. Base URL and live address

The live API is at:

```
https://accessmap-nairobi-api-1.onrender.com
```

This is the same address you use today. All v2 paths are on the same host —
only the path prefix changes from `/api/venues` to `/v2/venues`. The API runs
on Render's free tier, so the first request after a quiet period may take up to
60 seconds. Subsequent requests are fast.

---

## 2. What changes for each of your 5 endpoints

### 2a. List venues — `GET /api/venues` → `GET /v2/venues`

**This is the one breaking change.** The response is now wrapped in an envelope:

| | v1 | v2 |
|---|---|---|
| Response type | bare array `[...]` | object `{ "data": [...], "count": N }` |
| Venue objects inside | same | identical — no field changes |

Everything else is unchanged: `?category=`, `?area=`, `?accessible=` all work
exactly as before. An empty result is `{ "data": [], "count": 0 }` instead of
`[]`.

### 2b. Get one venue — `GET /api/venues/:slug` → `GET /v2/venues/:slug`

**No breaking change in the response body.** The venue object is returned
directly (no envelope). Every field — `id`, `slug`, `name`, `area`, `address`,
`category`, `accessibility`, `coordinates`, `addedAt` — is identical.

The only change is the URL prefix.

### 2c. Average rating — `GET /api/venues/:slug/rating` → `GET /v2/venues/:slug/rating`

**No change at all** except the URL prefix. Response shape is unchanged:

```json
{ "slug": "kenyatta-national-hospital", "averageRating": 4.3, "totalReports": 3 }
```

### 2d. Add a venue — `POST /api/venues` → `POST /v2/venues`

**No change** except the URL prefix. Request body, validation rules, and
response shape (the `201` with the full venue object) are all identical.
Status codes are unchanged: `201` created, `400` validation error, `409`
duplicate.

### 2e. Submit a report — `POST /api/reports`

**No change at all.** This endpoint does not move. Continue calling
`POST /api/reports` on either the live URL or locally. Nothing about this
endpoint is being versioned.

---

## 3. Before and after examples

### List venues (the breaking change)

**v1 — before (returns a bare array)**

```
GET https://accessmap-nairobi-api-1.onrender.com/api/venues?category=hospital
```

Response `200`:

```json
[
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
```

**v2 — after (wrapped in `{ data, count }`)**

```
GET https://accessmap-nairobi-api-1.onrender.com/v2/venues?category=hospital
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

---

### Get one venue (no body change — URL prefix only)

**v1 — before**

```
GET https://accessmap-nairobi-api-1.onrender.com/api/venues/kenyatta-national-hospital
```

**v2 — after**

```
GET https://accessmap-nairobi-api-1.onrender.com/v2/venues/kenyatta-national-hospital
```

Response `200` — **identical body, both versions:**

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

## 4. Answers to your specific questions

**Does `?category=` still work on v2?**
Yes. All three query parameters — `?category=`, `?area=`, and `?accessible=`
— work exactly as before on `/v2/venues`. Combine them the same way you do now.

**Is the `am-api-key` header and your key the same?**
Yes. The header name is still `am-api-key`. Your existing key is unchanged.
Public read endpoints (GET list, GET by slug, GET rating) remain public — no
key required for those. Writes (POST venue, POST report) still require the key.

**Your v2 URLs:**

| Endpoint | v1 URL | v2 URL |
|---|---|---|
| List venues | `GET /api/venues` | `GET /v2/venues` |
| Get one venue | `GET /api/venues/:slug` | `GET /v2/venues/:slug` |
| Rating | `GET /api/venues/:slug/rating` | `GET /v2/venues/:slug/rating` |
| Add venue | `POST /api/venues` | `POST /v2/venues` |
| Submit report | `POST /api/reports` | `POST /api/reports` (**unchanged**) |

---

## 5. How to migrate

The only code change is in the place where you call `GET /api/venues`. Find
the line where you fetch the venue list and apply this pattern:

```js
// Before (v1)
const venues = await fetch(`${API_BASE}/api/venues?category=waste-facility`).then(r => r.json());
venues.forEach(v => { /* use v.name, v.coordinates, etc. */ });

// After (v2) — two changes: URL prefix, destructure data
const { data: venues } = await fetch(`${API_BASE}/v2/venues?category=waste-facility`).then(r => r.json());
venues.forEach(v => { /* same v.name, v.coordinates — nothing else changes */ });
```

Everything else in your code — venue detail fetches, rating fetches, the report
form, how you read individual venue fields — requires no changes.

---

## 6. Sunset date

**v1 (`/api/venues`) will continue running through Friday 13 November 2026
(Demo Day).** It will not be switched off before your presentation.

After Demo Day we may retire v1, but we will confirm before doing so. The
sunset date written in the response headers of every v1 call is
`Fri, 13 Nov 2026 00:00:00 GMT` — that is the planned date, not the
instant it stops; we will not pull it during the session itself.

---

## 7. Confirming your migration — what we will check

Once you have switched to v2, ask us and we will read our `/api/stats` endpoint
(requires our API key, so we will do this on our side). We will look for:

- A `GET /v2/venues` row in the `routes` object with a count that matches your
  calls and your caller label (a short fingerprint of your key)
- The `GET /api/venues` (v1/legacy) count stopping at whatever it was before
  you switched

We will share the relevant lines from the stats output with you as confirmation.
You can also verify on your end: after switching, your response body should
**not** be a bare array — checking `Array.isArray(response)` should return
`false`, and `response.data` should be your venue array.

---

## 8. Summary checklist for your migration

- [ ] Find the fetch call for `GET /api/venues` in your code
- [ ] Change the URL to `GET /v2/venues` (same base URL, same query params)
- [ ] Destructure `data` from the response: `const { data: venues } = await res.json()`
- [ ] Leave all other API calls unchanged (`/api/venues/:slug`, `/api/reports`, etc.)
- [ ] Test that your venue list renders correctly
- [ ] Reply to confirm — we will check `/api/stats` and confirm back

---

This file is permanently committed at
[`DEPRECATION_NOTICE.md`](./DEPRECATION_NOTICE.md) in the repository.
