Group 13 has not yet ran  their tests yet on our contract, they are doing this  by sunday

Partner Test Results 
Partner API Tested: Voter Edu API (Group 11)

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
