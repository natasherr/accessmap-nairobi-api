
# Partner Blind Test & API Alignment Report

**Tested API:** AccessMap Nairobi API ([https://natasherr.github.io/accessmap-nairobi-api/](https://natasherr.github.io/accessmap-nairobi-api/))
**Testers (Team 12):** Tiphanie Waweru, Rayan Abdi,Roy Machisu
**Date:** 12/10/2026

---

## 1. Executive Summary & Blind Test Overview

The blind test was conducted using only the published README and live endpoints without prior verbal walkthroughs or code peeking. Overall, the AccessMap Nairobi API worked cleanly end-to-end[cite: 2].

* **Time to First Success:** A few seconds (following initial cold-start delay)[cite: 2].
* **Core Flow Status:** Retrieving venues, filtering lists, fetching ratings, posting new venues (`POST /api/venues`), and submitting community reports (`POST /api/reports`) all succeeded as documented.

---

## 2. Key Observations & Operational Notes

* **Cold-Start Delay:** The free-tier host on Render requires a 30 to 40-second spin-up time on the first request after being idle; users should expect this delay and not mistake it for a server hang[cite: 2].
* **Authentication:** No authentication is required for current public endpoints, ensuring smooth initial test runs.
* **Duplicate Protection:** Re-running the venue creation step (`POST /api/venues`) with identical name and area parameters correctly throws a `409 Conflict` error rather than generating duplicate entries[cite: 2].
* **Payload Nuance:** When submitting accessibility reports via `POST /api/reports`, callers must use the server-assigned internal `id` (e.g., `v_034`) rather than the venue's `slug`[cite: 2].

---

## 3. Discovered Documentation & Contract Inconsistency (`hotel` Category)

During the documentation read-through and test execution, an inconsistency was identified in the `category` filter specification[cite: 2]:

* **The Inconsistency:** The documented `category` query parameter enum lists only `hospital, market, office, school, transport, bank, other`. However, the documentation's own worked example filters using `category=hotel` and successfully returns a matching `200 OK` response with `"category": "hotel"`[cite: 2].
* **The Resolution (YAML Contract Update):** To prevent automated contract validators or strict downstream partners from rejecting requests, `"hotel"` must be formally added to the `enum` list in the OpenAPI YAML specification.

### Recommended OpenAPI Update (`openapi.yaml`):

```yaml
category:
  type: string
  enum:
    - hotel        # Added to resolve documentation/implementation gap
    - hospital
    - market
    - office
    - school
    - transport
    - bank
    - other
  example: market
```

**AFTER HANDING OVER TO TEAM 13**

When Team 13  sent a POST request to submit a community accessibility report at /api/reports, the server responded with a generic 500 Internal Server Error rather than processing the data or returning a validation error.

**Root Cause Analysis**
Upon inspecting the backend server logic and production deployment pipeline, two compounding issues were identified:

Deployment Sync Lag: Recent code adjustments made locally had not been committed and pushed to GitHub. Consequently, the live production environment on Render was running an outdated version of the code.

Code Defect (ReferenceError): Inside server/routes/reports.js, a leftover snippet (slug = generateSlug(v.name);) referenced an undefined variable v and an unimported function, triggering an unhandled runtime exception on every report submission attempt. This crashed the execution context before it reached the database insert query.

**Resolution & Fixes Applied**
Code Cleanup: Removed the erroneous slug-generation block from server/routes/reports.js since reports rely strictly on venueId, ratings, and accessibility metadata rather than unique venue slugs.

Deployment Synchronization: Committed the updated routing logic and pushed the changes to the main branch on GitHub to trigger a fresh, synchronized build on Render.

**Post-Fix Verification:** Re-tested the production endpoint via command-line invocation to verify schema compliance:

**PowerShell**

```Shell
curl.exe -X POST https://accessmap-nairobi-api-1.onrender.com/api/reports -H "Content-Type: application/json" -d "@report.json"
```


Result: The endpoint successfully validated the payload, verified the target venue's existence, stored the report in Supabase/PostgreSQL, and responded with a 201 Created status alongside the correctly shaped Report object.
