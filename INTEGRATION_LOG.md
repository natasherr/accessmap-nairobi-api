# Week 10 Integration Log

Date: 21 October 2026  
Upstream partner: Voter Edu API (Group 11)  
Local app: AccessMap Nairobi

| # | What happened | Root cause | Fix or response | Whose code / who fixed it |
|---|---|---|---|---|
| 1 | The local candidates route returned `200 OK` with candidate data from Voter Edu. | No issue. The partner API was reachable and returned the expected candidate list. | Confirmed the response included candidate IDs, names, parties, `average_rating`, and `review_count`. The UI handles `null` ratings as “No rating yet.” | No bug. |
| 2 | With `PARTNER_URL` temporarily set to an invalid address, the Voter Guide showed its candidate-unavailable message. The rest of the venue page remained usable. | The partner URL was intentionally made invalid to simulate the partner API being unavailable. | Confirmed the frontend displayed a friendly message rather than crashing or showing a blank page. | AccessMap’s server and frontend handled the failure; no partner code change was needed. |
| 3 | During the simulated outage, the AccessMap health check still returned `AccessMap API is running`. | The partner API was unreachable, but AccessMap’s own server was still running. | Confirmed the local API remained available at `http://localhost:5000/`. | No bug. |
| 4 | After restoring the real `PARTNER_URL` and restarting the backend, the Voter Guide loaded candidate data again. Selecting a candidate loaded that candidate’s reviews. | The partner URL had been intentionally changed for the outage check. | Restored `PARTNER_URL`, restarted the backend, and refreshed the page. The integration recovered without code changes. | AccessMap configuration restored locally; no partner code change was needed. |

## Part D result

The app handled the simulated partner outage gracefully. The venue page and AccessMap API stayed available, and the Voter Guide recovered after the real partner URL was restored.