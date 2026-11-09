# Stale Rally Data and Loading UX

## What changed

- The `/api/partner/rallies` request allows a 30-second upstream timeout per
  attempt, one retry, and a one-second retry delay. Its timed-out retry path is
  bounded to approximately 61 seconds.
- The rallies panel allows up to 65 seconds for the AccessMap API request so a
  sleeping hosted partner can wake up. It stores successful rally responses in
  browser local storage and uses that copy if the API cannot be reached.
- The panel shows saved rallies while refreshing when a browser cache exists.
  When there is no data yet, it shows an animated, screen-reader-accessible
  loading circle instead of an empty area.
- Stale responses retain their original timestamp. If no server or browser
  cache is available, the existing unavailable message is shown.

## Review locations

- [server/routes/partner.js](./server/routes/partner.js) applies the faster
  retry settings to rallies only.
- [server/resilientFetch.js](./server/resilientFetch.js) caps partner-provided
  retry delays using the configured endpoint limit.
- [client/src/components/VoterEduPanel.jsx](./client/src/components/VoterEduPanel.jsx)
  contains the browser cache, request timeout, and loading indicator.
- [server/__tests__/partnerResilience.test.js](./server/__tests__/partnerResilience.test.js)
  checks fallback responses and the reduced number of upstream attempts.
- [RESILIENCE_NOTES.md](./RESILIENCE_NOTES.md) records the timing budget and
  manual resilience drill.

## Validation

Run the backend resilience suite from `server`:

```powershell
npm run test:resilience
```

Run the client production build from `client`:

```powershell
npm run build
```

Browser local storage is per browser/profile and survives API restarts, but
clearing site data removes the fallback copy. A first visit with no saved
rallies still shows the loading circle and then the unavailable message if
both the partner and API fail.
