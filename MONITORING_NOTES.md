# Week 12 Monitoring Notes

## Predictions before collecting traffic

- **Likely slowest:** `GET /api/venues`, because it reads the venue list from
  the database. `GET /api/partner/rallies` may instead be slow during an
  upstream timeout.
- **Likely to show the most server errors:** `GET /api/partner/rallies` if the
  partner is unavailable. Invalid venue slugs may create more 404 client errors
  when the traffic script runs.

These are predictions only. Replace them with measured results after running
the traffic script and reading `/api/stats`.

## Measured results

Fill this section in during the lab. Do not copy the predictions as if they
were measurements.

- Slowest average route (`avgMs`): ______
- Slowest single request (`maxMs`): ______
- Route with the most 4xx / 5xx errors: ______
- Total requests and 5xx error rate: ______
- A real traffic pattern, with counts and timings: ______
- What might explain the pattern, and what to check next: ______

## Alert idea

Alert if the server error rate stays above 5% for five minutes. Notify the API
maintainer to investigate the failing route. While it is being fixed, the
rallies feature should continue showing its last-known-good data when available.

## What the monitoring code does

- `monitoring.js` starts a precise timer when a request arrives and logs one
  JSON line when the response finishes.
- The log uses `req.path`, so query parameters are left out. It hashes a valid
  API key into a short caller label instead of writing the key.
- The same finish handler counts requests and groups them by route pattern.
  For example, different item IDs share one route row.
- `GET /api/stats` returns the counts and averages held in server memory. The
  counts reset when the server restarts. A 401 or 429 rejected before a route
  matches appears under `(no route)`.

## Commands for the lab

From `server`, start the API in one terminal and save its output:

```powershell
npm run dev 2>&1 | Tee-Object -FilePath requests.log
```

In another PowerShell terminal, configure and run the traffic script:

```powershell
node traffic.js
```

The script loads `API_KEY` and optional `API_URL` from `server/.env`. Without
`API_URL`, it targets the local API at `http://localhost:<PORT>`. To test the
deployed API, set `API_URL=https://accessmap-nairobi-api-1.onrender.com` in
`server/.env`; make sure `API_KEY` is a key accepted by that deployment. The
script defaults to 60 requests and prints the resulting `/api/stats` response.

Try a wrong key without putting a real key in the command:

```powershell
curl.exe -i -H "am-api-key: wrong" "$env:API_URL/api/stats"
curl.exe -i "$env:API_URL/api/stats"
```

The venue list and rallies GET routes are public in this project, so the script
uses the protected civic route to demonstrate a caller fingerprint and a 401
without a key. Replace `<your-api-key>` locally; never commit or share the real
without a key. Use a valid key accepted by the selected API. `requests.log` is
ignored by Git.
