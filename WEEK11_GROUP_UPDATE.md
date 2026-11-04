# Week 11 update: API resilience

The Week 11 resilience work is ready for review. It adds timeouts and bounded
retries for safe partner API reads, serves last-known-good data when the
partner is unavailable, and shows when rally data is stale. It also includes
automated tests and a local flaky-partner demo.c

After the changes are pushed, sync your local `develop` branch:

```powershell
git switch develop
git pull origin develop
```

Run the focused checks from the `server` folder:

```powershell
npm run test:resilience
```

For the local demo instructions and observed results, see
[RESILIENCE_NOTES.md](./RESILIENCE_NOTES.md). Do not point Render's
`PARTNER_URL` at the local simulator.
