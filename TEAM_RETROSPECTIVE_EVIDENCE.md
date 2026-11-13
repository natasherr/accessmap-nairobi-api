# Team Project Evidence and Individual Retrospective Checkpoints

This guide gathers project facts and points teammates to the evidence behind
them. It is preparation material, **not an individual retrospective**. The Week
14 handout requires each person to write a 600–900 word `RETROSPECTIVE.md` in
their own words, with four sections. Use the checkpoints at the end to add
firsthand details. Do not copy another member's contribution, rating, or
personal learning.

## 1. Product and ring context

The project is AccessMap Nairobi, a venue-accessibility directory and API for
Nairobi. It exposes venue location and accessibility information, and accepts
community reports about visits. The team charter identifies Team 12 as a
consumer of Group 11's Voter Education API and a provider of venue information
to Group 13 (Kanairo-Klean). Confirm current team membership and the division
of work with your teammates; a charter records an intended role, not necessarily
what each person actually did.

The documented needs for Group 13 include:

- Filtering venues by category and area to help plan waste-collection
  locations.
- Reading an individual venue's address, coordinates, and accessibility
  features.
- Reading average ratings and finding accessible venues that could serve as
  meeting points.

The related use case for Group 11 is that civic venues such as schools and
community halls can support voter-education activity. Later partner feedback
work adds a way for rally attendees to report accessibility and congestion
issues. These use cases are documented in [API_NEEDS.md](./API_NEEDS.md),
[TEAM_CHARTER.md](./TEAM_CHARTER.md), and
[ENDPOINTS_LIST.md](./ENDPOINTS_LIST.md). Team members should describe how they
personally understood or changed these needs, rather than treating the
statements as proof that the original requirements were customer-focused.

## 2. What the repository shows was built

### Venue and community-report API

The Express API uses PostgreSQL through parameterized SQL queries. The venue
routes support listing and filtering venues, looking up a venue by slug,
returning a rating summary, and creating venues. Report routes support
submitting and listing reports. Inputs include validation for required fields,
accessibility booleans, rating bounds, and venue existence. Venue creation
checks for duplicates and returns `409`; a successful write returns `201`.
See [server/routes/venues.js](./server/routes/venues.js) and
[server/routes/reports.js](./server/routes/reports.js).

The documented partner-facing contract is in [openapi.yaml](./openapi.yaml).
The repository's [CONTRACT_DEVIATIONS.md](./CONTRACT_DEVIATIONS.md) records
past contract fixes: removing an undocumented `isSeeded` response field,
implementing a missing venue-rating endpoint, making venue filters work, and
documenting error response shapes and the duplicate-venue `409`. It also says
`GET /api/reports` and `GET /api/venues/{venueId}/reports` are additional
frontend endpoints not yet represented in the contract. Treat those as the
document's recorded status; verify the current contract and route before
describing them as resolved.

### Authentication, error handling, and request limits

The app middleware makes selected read-only routes public, protects other API
routes with the `am-api-key` header, and applies rate limits. Public reads have
a limit of 100 requests per minute per IP; protected requests have a limit of
100 per minute per key. The rally-comment endpoint is an intentional,
narrowly scoped public write with a five-per-minute limit. Malformed JSON is
handled as a `400`; Express's `X-Powered-By` header is disabled. See
[server/app.js](./server/app.js), [server/middleware.js](./server/middleware.js),
and [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

The security audit dated October 26, 2026 records checks of response fields,
error behavior, extra request fields, key handling, and rate limiting. It lists
two fixes (disabling the framework header and handling malformed JSON) and
residual risks, including shared keys, no moderation for venue/report writes,
per-process in-memory rate limits, and permissive CORS for public data. A
retrospective should distinguish these documented checks from any security
tests the individual actually performed.

### Partner integration and resilience

The backend proxies partner requests; the partner URL and key are server-side
environment configuration, not intended for the browser. The Week 10
integration log records a civic-venue-gated integration and specific
deployment/configuration issues: a localhost frontend API base, a missing
redeploy after setting `PARTNER_URL`, a civic panel rendered on non-civic
venues, an incorrect attempt to call an Express router as a function, and a
partner URL hardcoded in a frontend attribution link. The log describes fixes
and a simulated outage in which the Voter Guide became unavailable while
AccessMap venue data remained usable. See [INTEGRATION_LOG.md](./INTEGRATION_LOG.md).

The resilience implementation adds bounded retries for safe partner GETs,
timeouts, retryable HTTP status handling, last-known-good data in server
memory, and a local stand-in with `ok`, `slow`, `flaky`, and `error` modes.
Rally feedback POSTs are not retried to avoid duplicate writes. The browser
also caches successful rallies in local storage and shows saved data when it
cannot retrieve fresh data. Evidence and caveats are in
[RESILIENCE_NOTES.md](./RESILIENCE_NOTES.md),
[STALE_DATA_REVIEW.md](./STALE_DATA_REVIEW.md),
[server/resilientFetch.js](./server/resilientFetch.js),
[server/routes/partner.js](./server/routes/partner.js), and
[client/src/components/VoterEduPanel.jsx](./client/src/components/VoterEduPanel.jsx).

The recorded resilience drill results report live `stale=false` responses in
`ok` and `flaky` modes; `stale=true` after cached data plus upstream failure
or timeout; and `502` when no prior good data exists. The notes explicitly
state that connection-refused testing was **not run**, and the browser visual
check remained a manual follow-up. Those results are documentation in the
repository, not proof that each present team member personally ran the drill.

### Monitoring and external tests

Request logging records method, route, status, duration, and a short API-key
fingerprint rather than the key. `GET /api/stats` reports in-memory totals and
route statistics and requires an API key. The Week 12
[MONITORING_NOTES.md](./MONITORING_NOTES.md) still contains blank fields for
measured traffic, slowest routes, error rates, and patterns. Do not present
predictions in that file as measured results.

The partner blind-test document reports that Team 12's API core flows worked
for Team 13, with a reported cold-start delay and a documentation inconsistency
around the `hotel` category. It also describes a report-submission `500`
caused by an undefined variable in the report route and deployment lag; the
document says the code was cleaned up, pushed, and subsequently returned
`201`. The same document's date `12/10/2026` is ambiguous by date convention,
so confirm the intended date before citing it. See
[BLIND_TEST_REPORT.md](./BLIND_TEST_REPORT.md).

[PARTNER_TEST_RESULTS.md](./PARTNER_TEST_RESULTS.md) records a Group 13 test
run on October 19, 2026: 12 of 13 tests passed. Their invalid filter request
`GET /api/venues?accessible=not-a-boolean` returned `200 OK`, while the
contract expected `400 Bad Request`. The report says validation was added to
`server/routes/venues.js`, and valid filter values continued to work. It also
records a separate test of Group 11's API that found contract/implementation
differences. That section describes findings shared with Group 11; it does not
establish that Group 11 fixed them.

## 3. Facts to verify before telling a personal story

The project records are team artifacts. They do not prove which person wrote
each change, how long a particular issue took, who communicated with a
partner, or who was present at a demo. Some of those details may be in Git
history, messages, issue threads, or an individual's memory; check those
before writing first person.

There are also details that should not be presented as settled without
confirmation:

- The team charter describes AccessMap as “100% frontend,” while this repository
  contains a working Express/PostgreSQL API. Use the precise project context
  you worked on; do not repeat the description without explaining it.
- The team's local database/migration history and the decision to use SQL
  instead of Prisma are not fully established by these documents. If you
  personally participated, explain the actual sequence and why the lab
  requirement led to the change.
- A locally running flaky-partner simulator is not the live Group 11 service.
  Separate simulated tests from live integration tests.
- Render cold starts and partner latency are reported observations, but their
  duration can vary. Give a date, measurement, and environment if you cite a
  specific time.
- A successful build or an automated test does not by itself prove a live
  partner demo, completed pre-flight, submitted feedback for classmates, or
  completion of every manual resilience check.
- Never include real keys, `.env` values, or private credentials in the
  retrospective or shared team notes.

## 4. Individual retrospective checkpoints

The Week 14 handout asks for four sections in 600–900 words total. Each person
should choose evidence that matches their own experience and use specific
details (week/date, endpoint, status, filename, observed behavior, or a quote
from their own log). Do not fill gaps by guessing.

### A. Hardest lifecycle stage

Choose the stage that was genuinely hardest **for you or your team**, then
identify the cause: unclear requirements, a dependency on another team, a
late decision, test tooling, deployment configuration, time, or version
conflict. Possible evidence to check includes the contract deviation history,
integration log, partner test results, and resilience notes. State whether
your example is firsthand or from a project record.

### B. One real cross-team issue

Pick one specific incident and establish:

1. Which two teams or systems were involved?
2. What request, field, URL, payload, or behavior failed?
3. What status/result was expected and what actually happened?
4. How was it discovered (partner test, live demo, logs, or your own test)?
5. What did **you** do, what did teammates/partners do, and how was it
   verified?
6. How long did it take? If there is no reliable time record, say that rather
   than inventing one.

The Group 13 invalid-`accessible` filter and the report-submission `500`
described in the blind-test report are possible documented incidents. Use one
only if you can accurately describe your own involvement. The Group 11
contract-test findings are a separate incident involving the upstream
partner; the record says findings were shared, not that they were fixed.

### C. What you would design differently

Name a concrete decision you would change and when you would make it (for
example, agree the database/migration approach before building, review the
contract with partners earlier, add negative tests before deployment, or
schedule a live integration check). Explain the specific cost or failure this
would have avoided. Also say what you would keep and why, such as a
customer-backed use case, contract tests, server-side secret handling, or
bounded retries—only if it reflects your own considered view.

### D. Your contribution

Give an honest score out of 10 and support it with work you personally owned:
code, database work, tests, documentation, deployment, partner communication,
review, or presentation. Identify one area where you helped the team and one
where teammates helped you. Verify ownership from your own commits, reviews,
messages, task notes, or recollection. A repository feature is not automatically
an individual's contribution.

## 5. Source index

| Topic | Repository evidence |
| --- | --- |
| Product needs and downstream use case | [API_NEEDS.md](./API_NEEDS.md), [TEAM_CHARTER.md](./TEAM_CHARTER.md) |
| Consumer endpoints and filters | [ENDPOINTS_LIST.md](./ENDPOINTS_LIST.md), [openapi.yaml](./openapi.yaml) |
| Contract drift and recorded fixes | [CONTRACT_DEVIATIONS.md](./CONTRACT_DEVIATIONS.md) |
| Team 13 tests and invalid-filter bug | [PARTNER_TEST_RESULTS.md](./PARTNER_TEST_RESULTS.md) |
| Blind test, report `500`, and cold start | [BLIND_TEST_REPORT.md](./BLIND_TEST_REPORT.md) |
| VoterEdu integration issues | [INTEGRATION_LOG.md](./INTEGRATION_LOG.md) |
| Retry/cache implementation and drill | [RESILIENCE_NOTES.md](./RESILIENCE_NOTES.md), [STALE_DATA_REVIEW.md](./STALE_DATA_REVIEW.md) |
| Traffic measurements still to complete | [MONITORING_NOTES.md](./MONITORING_NOTES.md) |
| Authentication and security checks | [SECURITY_AUDIT.md](./SECURITY_AUDIT.md), [server/app.js](./server/app.js) |
| Week 14 personal-report requirements | Week 14 Lab Handout, Part D and rubric |
