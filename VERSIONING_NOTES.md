# Versioning Notes — Week 13

## The change

`GET /api/venues` (and the same filtered calls with `?category=`, `?area=`,
`?accessible=`) will stop returning a bare JSON array. In v2 the response is
wrapped in an envelope object:

```json
{ "data": [ ...venues... ], "count": 3 }
```

## Why it is worth a break

The current flat-array response makes it impossible to add paging later without
another breaking change. If we ever need to return `page`, `pageSize`, or
`total` alongside the items we would have to break callers again. Wrapping the
list now costs one migration and buys us a stable envelope forever. It also
makes the response self-describing: a consumer can read `count` without
iterating the array.

## Prediction: which exact line in Group 13's code will fail

Group 13 (Kanairo-Klean) calls `GET /api/venues` and iterates the result as a
plain array. The line that will fail is wherever they do something like:

```js
const venues = await res.json();   // was an array, now { data: [...], count: N }
venues.map(...)                    // TypeError: venues.map is not a function
// or
venues.forEach(...)
// or
venues.filter(...)
```

Any code that treats the response body directly as an array will throw at
runtime or silently produce `undefined`/`NaN` values. The fix for them is a
one-line change: `const venues = (await res.json()).data;`.

---

## Who is still on v1?

*(To be filled in after running `GET /api/stats` once traffic has been
generated — see Part F.)*

Rows to look for in `/api/stats`:

| Route pattern | Count | Caller labels |
|---|---|---|
| `GET /v1/venues` | — | — |
| `GET /api/venues` (legacy) | — | — |
| `GET /v2/venues` | — | — |

---

## Reflection

### What was it like to receive a breaking change on short notice?

The notice arrived as a `DEPRECATION_NOTICE.md` committed to Group 11's repo,
with a direct message linking to it. The first thing I did was read the
before/after example — that told me immediately whether my code would break and
where. In this case the shape change was a wrapper around the array, which
matched exactly what we were shipping downstream. The `VoterEduPanel` and civic
proxy routes call `fetchPartnerJson` which stores and returns the raw response
body; any code that assumed `Array.isArray(data)` would silently fall through
to the stale-data path. That is the quiet failure the handout warns about: the
page looks fine, but you are showing week-old candidates. I only found that by
deliberately checking `stale: false` after switching, rather than trusting the
page to look correct.

### What did the partner's notice do well, and what was missing?

What worked: a concrete before/after JSON example, a named sunset date, and a
list of what was *not* changing. Knowing that the individual candidate objects
were identical meant I only had to change the unwrapping line, not rewrite any
downstream template or display code. What was missing: the notice did not say
whether the `PARTNER_URL` base path stays the same or whether v2 is at a
different prefix (e.g. `/api/v2/candidates` vs `/api/candidates`). I had to
ask. A sentence like "the new URL is `/api/v2/candidates`; the old
`/api/candidates` continues until sunset" would have saved a round-trip.

### Reading our own notice as Group 13

Reading `DEPRECATION_NOTICE.md` from Group 13's perspective: the before/after
examples are clear and the "What is NOT changing" section directly addresses the
fear of having to rewrite individual venue rendering. The sunset date is
specific. One gap: the notice says "change the URL and destructure `data`" but
does not call out the specific variable name in their fetch call. Group 13 might
be doing `const venues = await res.json()` in a React hook and destructuring
from there; it would be more useful to show the exact one-line change in their
likely pattern rather than a generic snippet. I would add a note saying "if you
use our context/hook, the change is inside `useVenues.js` on the line that calls
`res.json()`".

### One thing to do differently next time as the API owner

Before choosing a sunset date I would do a quick count of how many active
callers I had on the endpoint, using `/api/stats` or the logs. I picked 9 days
partly because the handout suggested enough time for a partner to migrate, but
I did not verify that Group 13 had any upcoming blocking work that week. In
practice, the right question is: "given the volume of work their team has
between now and Demo Day, is nine days realistic?" That conversation should
happen before the notice is sent, not after.
