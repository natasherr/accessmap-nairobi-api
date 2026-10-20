
# Partner Integration Test Results From Downstream Parner(Group 13)

- **Target URL:** `https://accessmap-nairobi-api-1.onrender.com`
- **Execution Date:** October 19, 2026
- **Total Tests:** 13 | **Passed:** 12 | **Failed:** 1

---

## 1. Endpoint Test Summary

| Endpoint                                   | Test Case                                              | Status           | Notes                                               |
| :----------------------------------------- | :----------------------------------------------------- | :--------------- | :-------------------------------------------------- |
| **`GET /api/venues`**              | Category & Area Filters                                | **PASSED** | Returns 200 OK with valid schema.                   |
|                                            | Boolean Filter (`accessible=true`)                   | **PASSED** | Correctly filters boolean query.                    |
|                                            | Invalid Query Parameter (`accessible=not-a-boolean`) | **FAILED** | Received `200 OK` (Expected `400 Bad Request`). |
| **`POST /api/venues`**             | Happy Path Creation                                    | **PASSED** | Returns 201 Created with venue object.              |
|                                            | Missing Required Field                                 | **PASSED** | Returns 400 Bad Request.                            |
|                                            | Duplicate Venue Conflict                               | **PASSED** | Returns 409 Conflict.                               |
| **`GET /api/venues/:slug`**        | Happy Path Lookup                                      | **PASSED** | Returns 200 OK with full details.                   |
|                                            | Non-existent Slug                                      | **PASSED** | Returns 404 Not Found.                              |
| **`GET /api/venues/:slug/rating`** | Happy Path Lookup                                      | **PASSED** | Returns 200 OK with ratings & reports.              |
|                                            | Non-existent Slug                                      | **PASSED** | Returns 404 Not Found.                              |
| **`POST /api/reports`**            | Happy Path Submission                                  | **PASSED** | Returns 201 Created.                                |
|                                            | Out-of-Bounds Rating (> 5)                             | **PASSED** | Returns 400 Bad Request.                            |
|                                            | Invalid `venueId`                                    | **PASSED** | Returns 404 Not Found.                              |

## 2. Identified Bug & Action Items

* **Issue:** Query Parameter Validation Bypass (`GET /api/venues?accessible=not-a-boolean`)
* **Expected Result:** HTTP `400 Bad Request` as defined in `openapi.yaml`.
* **Actual Result:** HTTP `200 OK`.
* **Action Required:** Implement query parameter type validation/coercion middleware to reject malformed non-boolean parameters with a 400 status.

#### **Our action point**

The bug was confirmed as a **Real Bug** — our API was directly violating the OpenAPI contract by accepting non-boolean values for the `accessible` query parameter without returning a `400 Bad Request`.

**Fix applied in [`server/routes/venues.js`](server/routes/venues.js):**

Added an early-exit validation guard at the top of the `GET /api/venues` handler, before any SQL query is constructed:

```js
if (accessible !== undefined && accessible !== 'true' && accessible !== 'false') {
  return res.status(400).json({ error: 'accessible must be a boolean (true or false)' });
}
```

- **Before fix:** `GET /api/venues?accessible=not-a-boolean` → `200 OK` ❌
- **After fix:** `GET /api/venues?accessible=not-a-boolean` → `400 Bad Request` ✅
- Valid calls (`accessible=true`, `accessible=false`, or omitted) continue to behave correctly.
- **Status: Resolved** ✅

## 3. Performance & Setup Notes

* **Render Cold-Start Delays:** Initial live server requests experienced timeouts due to serverless spin-up delay.
* **Workaround:** Added `jest.setTimeout(15000);` to the test suite configuration to prevent false-positive timeout failures.

# Partner API Tested: Voter Edu API (Group 11)

Test Suite File: server/______tests______/partner/voteredu.test.js

Target URL: [https://iap-group11.onrender.com/api](https://iap-group11.onrender.com/api)

**Findings from Partner Test Execution**

* When executing the automated contract test suite—written strictly from Team 11's OpenAPI contract  without implementation assumptions—the suite yielded 4 passed tests and 14 failures.
* YAML

Successful Checks: Base server reachability and candidate retrieval (GET /candidates and GET /candidates/:candidateId) successfully returned **200 OK** responses matching the required schema shapes.

**1.Contract Divergences / Failures Found:**

Error Response Shape Mismatch: The contract specifies error responses adhering to the { code, message } schema. The live server responded with flat {"error": "..."} objects.
YAML

Query Parameter Filtering (minRating): The minRating query filter was ignored or failed to drop lower-rated reviews, and passing invalid parameters returned 200 OK instead of rejecting with a 400 Bad Request.
YAML

Unhandled Server Exceptions: Submitting out-of-range ratings, missing fields, or unknown candidate IDs triggered unhandled exceptions resulting in 500 Internal Server Error instead of graceful 400 or 404 client error responses.
YAML

**2.Classification of Findings & Resolutions**
In accordance with partner testing evaluation protocols, the identified discrepancies were classified and handled as follows:

Real Bugs (Implementation vs. Contract): Classified as implementation bugs on the partner's deployed backend because the server behavior directly violated explicit constraints and error schemas defined in their own OpenAPI contract.

Action Taken: Documented the exact failures with payload and status code logs to share with Team 11 so they can patch their routing and validation logic on Render. No modifications were made to bypass the contract requirements, ensuring strict test integrity.
