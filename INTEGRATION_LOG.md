# Week 10 Integration Log

Date: 21 October 2026
Upstream partner: Voter Edu API (Group 11)
Local app: AccessMap Nairobi
Partner base URL: configured via `PARTNER_URL` environment variable on Render (never hardcoded)

---

## Part A — Integration architecture

Our backend acts as a proxy between the browser and the Group 11 Voter Edu API.
The partner URL is read exclusively from `process.env.PARTNER_URL` on the server.
It is never sent to the browser, never logged, and never committed to source control.

```
Browser  →  GET /api/venues/:slug/civic              (our Render API)
                ↓  verifies venue exists + isCivic = true
                ↓  fetch(process.env.PARTNER_URL + '/candidates')
Group 11 Voter Edu API  →  our server  →  browser
```

Two server-side proxy routes were added to `server/routes/venues.js`:

| Route                                                  | What it does                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `GET /api/venues/:slug/civic`                        | Verifies venue is tagged `isCivic`, then proxies `GET /candidates` from Group 11 |
| `GET /api/venues/:slug/civic/candidates/:id/reviews` | Verifies `isCivic`, then proxies `GET /candidates/:id/reviews` from Group 11     |

The `isCivic` gate means the partner API is only called for venues explicitly tagged as civic centres — Nairobi City Hall, Kenya National Library, University of Nairobi, Strathmore University, and Nyayo National Stadium.

---

## Part B — Issues found and resolved

| # | What happened                                                                                                                                        | Root cause                                                                                               | Fix                                                                                                                                 | Who fixed it          |
| - | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 1 | `VoterEduPanel` displayed "Candidate information is unavailable" on the deployed site                                                              | `API_BASE` was hardcoded to `http://localhost:5000` — unreachable from the browser in production    | Updated `API_BASE` to the deployed Render URL                                                                                     | AccessMap             |
| 2 | `PARTNER_URL` env var was set on Render but the running server still returned `503 Voter Edu data is not configured`                             | The service had not been redeployed after the env var was added                                          | Triggered a manual redeploy on Render                                                                                               | AccessMap             |
| 3 | Voter Guide panel rendered on every venue detail page regardless of whether the venue has any civic purpose                                          | `VoterEduPanel` was mounted unconditionally in `VenueDetail.jsx`                                     | Added `isCivic` boolean column to the `Venue` table (default `false`); panel now only renders when `venue.isCivic === true` | AccessMap             |
| 4 | Civic proxy routes initially attempted to re-dispatch through the Express router object, which does not work                                         | `partnerRoutes(req, res)` called the router as a function — Express routers are not callable that way | Replaced with direct `fetch(process.env.PARTNER_URL + '/candidates')` calls inside the civic route handlers                       | AccessMap             |
| 5 | Partner URL (`iap-group11.onrender.com`) was hardcoded in the frontend attribution link                                                            | Oversight during initial integration                                                                     | Removed the `<a href>` pointing to the partner URL; replaced with plain attribution text                                          | AccessMap             |
| 6 | `.env.example` contained placeholder values like `"Get this url from the code"`                                                                  | Placeholder was written informally                                                                       | Rewrote `.env.example` with correct format, meaningful comments, and an example value for `PARTNER_URL`                         | AccessMap            |
| 7 | `GET /api/venues/candidates` returned `200 OK` with candidate list including `id`, `name`, `party`, `average_rating`, `review_count`   | No issue — confirmed the integration is working end-to-end                                              | Verified response shape matches what `VoterEduPanel` expects                                                                      | No bug                |
| 8 | With `PARTNER_URL` temporarily set to an invalid address, the Voter Guide showed its unavailable message; the rest of the venue page stayed usable | Intentional simulation of partner outage                                                                 | Confirmed graceful degradation: own API healthcheck still returned `200`, other venue data unaffected                             | No bug                |
| 9 | After restoring the real `PARTNER_URL` and redeploying, the Voter Guide loaded candidate data and reviews again                                    | `PARTNER_URL` had been changed for the outage test                                                     | Restored correct value and redeployed                                                                                               | No code change needed |

---

## Part C — Environment variable compliance

| Variable                 | Where set                                                           | Committed?                         |
| ------------------------ | ------------------------------------------------------------------- | ---------------------------------- |
| `PARTNER_URL`          | `server/.env` locally; Render environment variables in production | ❌ Never — `.env` is gitignored |
| `DATABASE_URL`         | `server/.env` locally; Render environment variables in production | ❌ Never                           |
| `ALLOW_PARTNER_WRITES` | `server/.env` locally when running write tests                    | ❌ Never                           |

Placeholder file: `.env.example` — committed, contains format guidance and example values, no real credentials.

---

## Part D — Graceful degradation result

The app handled the simulated partner outage correctly:

- The Voter Guide section showed a user-friendly message instead of crashing
- All other venue data (accessibility features, community reports, ratings) remained fully available
- The AccessMap API healthcheck at `/` continued returning `200 OK`
- After restoring `PARTNER_URL` and redeploying, the Voter Guide recovered with no code changes
