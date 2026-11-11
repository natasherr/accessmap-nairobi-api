# Deprecation notice: AccessMap Nairobi API v1 → v2

**To:** Kanairo-Klean (Group 13)
**From:** Jeremy Akanle, API lead, AccessMap Nairobi (Group 12)
**Date:** 4 November 2026

## Summary

v1 of the venue endpoints (`/api/venues`) is deprecated. **v2 is live now** at `/v2/venues`. **v1 stops being supported on Thursday 12 November 2026.** Please move before then, and reply "read" so I know this reached you.

## What is changing

- The venue list is wrapped: `GET /api/venues` returns `[ ... ]`, and `GET /v2/venues` returns `{ "data": [ ... ], "count": N }`. An empty result is `{ "data": [], "count": 0 }`.
- Four URLs move from `/api/...` to `/v2/...` (same host):

| What | v1 | v2 |
|---|---|---|
| List venues | `GET /api/venues` | `GET /v2/venues` |
| Get one venue | `GET /api/venues/:slug` | `GET /v2/venues/:slug` |
| Average rating | `GET /api/venues/:slug/rating` | `GET /v2/venues/:slug/rating` |
| Add a venue | `POST /api/venues` | `POST /v2/venues` |
| Submit a report | `POST /api/reports` | **no change** |

- Nothing else changes: the venue fields (`id`, `slug`, `name`, `area`, `address`, `category`, `isCivic`, `accessibility`, `coordinates`, `addedAt`), the `?category=`, `?area=` and `?accessible=` filters, the status codes (`201`, `400`, `404`, `409`), the `am-api-key` header and your key. Reads stay public; adding a venue or report still needs your key.

## Why

Wrapping the list in `{ data, count }` lets us add paging later without another breaking change, and the `/v2` prefix lets us ship it without breaking your running code.

## Before and after

**v1:** `GET /api/venues?category=hospital`

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

**v2:** `GET /v2/venues?category=hospital`

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

The single-venue, rating and add-venue responses have identical bodies in v1 and v2. Only their URLs change.

## How to migrate

1. Change the four URLs in the table above from `/api/...` to `/v2/...`. Same host, same key, same filters.
2. For the list only, read the venues from `body.data` instead of from the body itself:

   ```js
   // Before (v1)
   const venues = await fetch(`${API_BASE}/api/venues?category=market`).then(r => r.json());

   // After (v2)
   const { data: venues } = await fetch(`${API_BASE}/v2/venues?category=market`).then(r => r.json());
   ```

3. Leave `POST /api/reports` exactly as it is.
4. Test it: `Array.isArray(body)` should be `false` and `body.data` should be your list. Then tell me, with the time you ran it, so I can find your calls in my request log.

## Timeline

- **4 November 2026 (today):** v2 is live. v1 still works and now sends `Deprecation` and `Sunset` headers.
- **Thursday 12 November 2026:** v1 is retired. Please be fully on v2 by the end of this day, so both of our apps present on v2.
- **Friday 13 November 2026 (Demo Day):** so nobody's demo breaks, I will leave v1 running through the presentations. Please do not rely on it.

## Questions

Message me any time on [WhatsApp / email]. I will reply within [4 hours].

A permanent copy of this notice is committed in the repository as `DEPRECATION_NOTICE.md`.