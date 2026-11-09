# Week 11: Partner API resilience

## Integration under test

The venue-detail rallies panel requests `GET /api/partner/rallies`. The
AccessMap backend calls Group 11 using server-side `PARTNER_URL` and
`PARTNER_API_KEY`; neither the partner key nor upstream URL is sent to the
browser. `server/flaky-partner.js` is a local stand-in with `ok`, `slow`,
`flaky`, and `error` modes.

## Resilience settings

| Setting | Value | Reason |
| --- | ---: | --- |
| Per-attempt timeout | 1,500 ms | Bounds time spent waiting on one partner response. |
| Retries | 2 (3 attempts total) | Allows recovery from brief failures without retrying forever. |
| Retry delay | 200 ms, then 400 ms | Exponential backoff reduces pressure on a failing partner. |
| Retryable HTTP statuses | 429, 500, 502, 503, 504 | Client errors such as 401/404 will not improve by repeating the request. |
| Writes | Never retried | Repeating a POST could create duplicate records. |
| 429 delay | Partner `Retry-After`, capped at 5 seconds per wait | Respects the partner while bounding each pause. |

The rallies endpoint allows 30 seconds per attempt and one retry, with a
1-second delay between attempts. Its maximum timeout path is approximately
61 seconds; the browser allows 65 seconds for the request so a sleeping hosted
partner has time to wake and respond. Other partner feeds keep the general
settings above.

Successful valid JSON is held in server memory with an `asOf` timestamp. On a
later failure, the rallies endpoint responds with `{ data, stale: true, asOf }`;
the page displays a saved-data timestamp. If no good response has been cached
since startup, the endpoint responds with 502 and the page displays its
friendly unavailable message. Restarting the backend clears the server cache.
The browser also keeps the last successful rallies response in local storage,
so it can show saved rallies when the AccessMap API is unavailable. The browser
waits no longer than 65 seconds for the API before using that local copy.

## Local resilience drill

1. In `server/.env`, temporarily point `PARTNER_URL` to
   `http://localhost:4000`; leave the real partner credentials private.
2. In `server/.env`, temporarily set `API_URL=http://localhost:5000`.
   Restart the client and backend after changing environment values.
3. In one terminal, from `server`, run `npm run demo:partner`.
4. In another terminal, run the backend with `npm run dev`. Open the
   Westgate Shopping Mall detail page; the stand-in rally should appear in
   `ok` mode.
5. Change modes with `curl.exe http://localhost:4000/__mode/ok`,
   `/__mode/flaky`, `/__mode/error`, or `/__mode/slow`. Reload the venue page
   and record actual results below. `flaky` returns two 503 responses then a
   success. `slow` waits 10 seconds per call, so each request attempt should
   time out at the configured limit.
6. To test the no-cache fallback, restart the backend while the stand-in is
   in `slow` or `error` mode, then reload. Expect the friendly unavailable
   message. Restore the real partner URL in local environment settings after
   the drill; do not point Render at the local stand-in.

Automated checks run without Jest's database teardown or Supabase:

```powershell
cd server
npm run test:resilience
```

## Failure drill results

Record measured timings and observed logs during the lab. Expected outcomes
are not a substitute for actually completing the drill.

| Mode / failure | Expected user experience | Observed result and log |
| --- | --- | --- |
| `ok` | Live rally data, no stale banner | Observed HTTP 200, `stale=false` (31 ms) |
| `flaky` | Third attempt succeeds; live data, no stale banner | Observed HTTP 200, `stale=false` (678 ms); two 503 retries logged |
| `error` (HTTP 500), with cache | Two retries, then stale data | Observed HTTP 200, `stale=true` (684 ms); two 500 retries logged |
| `slow` (10-second response), with cache | Requests time out; stale data is returned | Observed HTTP 200, `stale=true` (5,154 ms); two retries logged after timeouts |
| `error` (HTTP 500), without cache | Friendly unavailable message | Observed HTTP 502 (651 ms) after two retries |
| Partner stopped / connection refused | Bounded retries; stale data if cached, otherwise friendly unavailable message | Not run |

These timings were measured by calling the Express proxy route against the local
stand-in; they are not browser-render timings. The production client build also
passed, but the browser-based visual check remains a manual follow-up.

## User impact and limitation

The rallies panel shows an animated loading indicator while no data is
available. With bounded retries, a brief partner failure may recover
automatically; otherwise the backend returns its last-known-good response in
under a second. If the AccessMap API itself is unavailable, the browser falls
back to its local copy after at most one second. If neither cache has data, the
page displays a clear unavailable message.

A circuit breaker would temporarily stop calling a repeatedly failing partner
and periodically send a probe request; this implementation instead retries
each safe GET a bounded number of times.
