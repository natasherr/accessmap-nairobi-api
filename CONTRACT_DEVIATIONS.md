

# Contract Deviations

This document tracks any place where our actual implementation differs from
`openapi.yaml`, per Week 5's requirement. Each entry is either a place we
fixed our code to match the contract, or a place we deliberately kept extra
behavior beyond what the contract promises.

---

## 1. `isSeeded` field removed from Venue responses

**What changed:** Our database stores an internal `isSeeded` boolean on every
venue (used to distinguish demo/seed data from user-submitted venues). Our
first implementation included this field in every `GET /api/venues` and
`GET /api/venues/{slug}` response.

**Why it's a deviation:** `openapi.yaml`'s `Venue` schema never lists
`isSeeded` as a property.

**Resolution:** Fixed the code, not the contract. `isSeeded` is an internal
implementation detail with no value to a ring partner — it was removed from
`reshapeVenue()` so responses now match the contract's `Venue` schema
exactly, field for field.

---

## 2. `GET /api/venues/{slug}/rating` was missing entirely

**What changed:** The contract defines this endpoint (average star rating
per venue), but our first implementation of `server.js` never built it.

**Why it's a deviation:** A documented endpoint that returns a 404 for every
request isn't a partial implementation — it's a missing one.

**Resolution:** Implemented the endpoint. It calculates `averageRating`
(rounded to one decimal place) and `totalReports` from the `Report` table,
matching the contract's response schema exactly, including the 404 case for
an unknown slug.

---

## 3. `GET /api/venues` was not applying its documented filters

**What changed:** The contract specifies `category`, `area`, and
`accessible` as optional query parameters on `GET /api/venues`. Our first
implementation accepted these parameters but silently ignored all of them —
every request returned the full unfiltered venue list.

**Resolution:** Fixed the code. The route now builds a real `where` clause
from the query parameters. Note: `accessible=true` is defined here as
`ramp AND accessibleToilet AND accessibleParking` all being true — this
specific definition isn't spelled out in the contract itself, and is worth
confirming directly with Team 13 (Kanairo-Klean) to make sure it matches
what they actually need for hotspot planning.

---

## 4. Two extra endpoints exist beyond the contract

**What exists but isn't documented:**

- `GET /api/reports` — returns every report in the system
- `GET /api/venues/{venueId}/reports` — returns all reports for one venue

**Why they're not a "fix":** These aren't drift from a documented promise —
they're genuinely extra surface area the contract never mentions at all.
They exist because our own frontend (the AccessMap Nairobi app itself, not
a ring partner) depends on them to display venue reports and community
report data.

**Resolution — kept, not removed.** These were briefly removed during Week 5
cleanup, then restored once it became clear the frontend depends on them.
They remain undocumented in `openapi.yaml` for now. Two possible next steps,
still to be decided as a team:

1. Formally add them to `openapi.yaml` — Team 13 may find `GET /api/reports`
   useful too, since it's read-only and low-risk to expose.
2. Leave them as internal-only endpoints, clearly separate from the ring
   contract, if the team decides not to expose report-level data to
   partners.

---

## Summary

| Deviation                                 | Type                   | Status                            |
| ----------------------------------------- | ---------------------- | --------------------------------- |
| `isSeeded` in Venue responses           | Extra field            | Fixed — removed                  |
| `/venues/{slug}/rating`                 | Missing endpoint       | Fixed — implemented              |
| Query param filtering on`/venues`       | Non-functional filters | Fixed — implemented              |
| `/reports` and `/venues/{id}/reports` | Undocumented extras    | Kept — not yet added to contract |
