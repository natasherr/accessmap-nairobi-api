# AccessMap Nairobi — Endpoint List

## What Group 13 (Kanairo-Klean) needs from us

| Method | Path | Purpose | Maps to Need |
|--------|------|---------|--------------|
| GET | `/api/venues?category=:category&area=:area` | Get all venues filtered by category and area | Kanairo-Klean needs to read a list of venues filtered by category and area, to identify neighborhoods for planning new waste collection hotspots |
| GET | `/api/venues/:slug` | Get full details of one venue including address, coordinates and accessibility badges | Kanairo-Klean needs to read a venue's address, coordinates and accessibility badges, to plot reference points on their hotspot map and confirm whether collection vehicles can physically access a site |
| GET | `/api/venues/:slug/rating` | Get the average star rating for one venue | Kanairo-Klean needs to read a venue's average star rating, to prioritize well-reviewed locations as collection hotspots |
| GET | `/api/venues?accessible=true` | Get all venues that have key accessibility features enabled | Kanairo-Klean needs to read a list of accessible venues, to suggest safe publicly accessible meeting points where waste sellers and buyers can conduct transactions |
| POST | `/api/venues` | Add a new venue to the directory | Kanairo-Klean needs to register new waste collection hotspot locations directly into the AccessMap directory |
| POST | `/api/createReport` | Submit an accessibility report for a specific venue | Kanairo-Klean needs to post ground-truth observations about a venue's physical accessibility, to keep hotspot location data accurate and up to date |

## Filters available

| Filter | Example | Description |
|--------|---------|-------------|
| `?category=` | `?category=market` | Filter by type e.g. market, hospital, school |
| `?area=` | `?area=Westlands` | Filter by Nairobi area e.g. Westlands, Karen, CBD |
| `?accessible=true` | `?accessible=true` | Only show venues with key accessibility features |

---

**Peer review feedback (short list):**

- Row 6: `/api/createReport` has a verb in the path ("create") – change to a noun, e.g. `/api/reports` or `/api/venues/:slug/reports`.
- Optional but recommended: If reports are specifically about a venue, consider nesting as `/api/venues/:slug/reports` (one level deep, still acceptable) rather than a top-level `/api/reports`. This better reflects the ownership relationship described in the "Maps to Need" column.
- Row 4: `?accessible=true` duplicates functionality already available through the filter pattern in Row 1 – consider consolidating (e.g., add `?accessible=true` as an additional filter to the main GET `/api/venues` endpoint) rather than having two separate GET endpoints. Not a violation, just a design suggestion.