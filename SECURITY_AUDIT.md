# Security Audit: AccessMap Nairobi API

**Date:** 26 October 2026
**Target:** the live API at https://accessmap-nairobi-api-1.onrender.com and this repository
**Scope:** all five endpoints in `openapi.yaml`, plus the API key and rate-limit layers

## 1. Summary

The API serves public directory data. It has no user accounts and stores no passwords, emails or other personal data, so the main risks are how keys are handled and how the write endpoints could be abused. We read every response the API can return (success and error) as an attacker would. We found one low-severity issue (a framework-disclosing header) and one key-handling issue from testing, and fixed both. The rate limit is 100 requests per minute.

## 2. What was checked

| Check | How it was tested | Result |
| --- | --- | --- |
| **Sensitive fields** | Read the JSON of every success response (list venues, get venue, rating, add venue, submit report) and compared it with what a consumer needs. | Responses contain only venue details, accessibility flags, coordinates, ratings and timestamps. No password hashes, tokens, emails or internal flags. |
| **Other people's data** | Changed the `slug` in `GET /api/venues/{slug}` and the `venueId` in `POST /api/reports`. | Not applicable in the usual sense. There are no user accounts and no private records. Venues and reports are public by design, and reports contain no reporter name or email. Changing an ID only returns or attaches to another public record. |
| **Error messages** | Triggered each error: missing key and wrong key (401), unknown slug (404), missing or invalid fields (400), duplicate venue (409), rate limit (429), and malformed JSON | Every error is a short JSON message. None shows a stack trace, file path, database query or table name. Unexpected failures return the generic `Unexpected server error`, and the detail stays in the server log. |
| **Write endpoints** | Sent extra, unrecognised fields in the bodies of `POST /api/venues` and `POST /api/reports`. | The extra fields were not saved. `id`, `slug` and timestamps are assigned by the server, not taken from the request. |
| **Keys in the wrong place** | Checked the README, source code and git history for keys, whether `.env` is git-ignored, and whether the server logs request headers. | The README uses only the `<your-api-key>` placeholder. No key in git history, `.env` is git-ignored, and headers are not logged. |

## 3. Findings and fixes

| # | Finding | Severity | Fix |
| --- | --- | --- | --- |
| F1 | Every response carried `X-Powered-By: Express`, which tells an attacker which framework to target. | Low | Disabled it with `app.disable('x-powered-by')`. |
| F2 | Leaked stack trace in requests with malformed json. | Medium | Added a handler for failed parsing errors. |

No other issues were found in the checks above.

## 4. Residual risks (accepted)

- **Any key holder can add data.** `POST /api/venues` and `POST /api/reports` accept submissions with no moderation, and there is no delete endpoint. Mitigated by issuing keys per team and by the rate limit.
- **Keys are shared secrets.** A key embedded in browser code is visible to anyone who opens dev tools, so keys are meant for server-to-server consumers.
- **CORS allows any origin** (`Access-Control-Allow-Origin: *`). Acceptable because authentication is a header, not a cookie, but it means any website can call the API if it has a key.
- **One limit for all endpoints.** Writes share the same budget as reads. A stricter limit on `POST` routes would be a sensible next step, along with storing only hashes of keys.
- **Transport security** is provided by Render (HTTPS) for the live API.

## 5. Rate limit: 100 requests per minute

The limit is **100 requests per minute per API key**, across all endpoints. Exceeding it returns `429` with a `Retry-After` header and a JSON body telling the caller how many seconds to wait.

Why 100:

- **It leaves room for real use.** A consumer that lists venues and then fetches each venue's rating makes about 34 requests in a burst (33 seeded venues plus the list call). 100 covers that and still leaves headroom.
- **It stops scraping and abuse.** A script looping over the API would hit the limit within seconds, instead of copying the whole directory or flooding the write endpoints.
- **It protects a small host.** The API runs on a free-tier Render instance with a small database connection pool, so unbounded traffic from one caller could slow it down for everyone else.
- **It doesn't punish normal clients.** A much lower value, such as the 3 I used temporarily to test the limiter (`200 200 200 429 429`), would block legitimate bursts. A much higher value would give almost no protection.
- **Clients can recover.** Because the `429` includes `Retry-After`, a well-behaved client knows exactly when to try again.