import { useEffect, useState } from "react";

const API_BASE = "https://accessmap-nairobi-api-1.onrender.com/api";

// Kenya General Election date — update when the official date is confirmed
const ELECTION_DATE = new Date("2027-08-10T06:00:00+03:00");

// ── Party theme lookup ────────────────────────────────────────────────────
// All colour values live in tailwind.config.js under 'party-uda', 'party-azimio',
// and 'party-neutral'. This map just references those token names so the
// component stays free of hex values.
const PARTY_THEMES = {
  // keywords → Tailwind token classes
  uda:    { bar: "bg-party-uda",     border: "border-l-party-uda",     dot: "bg-party-uda",     monogram: "bg-party-uda-light text-party-uda-text",     pill: "bg-party-uda-light text-party-uda-text border-party-uda/30" },
  kwanza: { bar: "bg-party-uda",     border: "border-l-party-uda",     dot: "bg-party-uda",     monogram: "bg-party-uda-light text-party-uda-text",     pill: "bg-party-uda-light text-party-uda-text border-party-uda/30" },
  azimio: { bar: "bg-party-azimio",  border: "border-l-party-azimio",  dot: "bg-party-azimio",  monogram: "bg-party-azimio-light text-party-azimio-text",  pill: "bg-party-azimio-light text-party-azimio-text border-party-azimio/30" },
  wiper:  { bar: "bg-party-azimio",  border: "border-l-party-azimio",  dot: "bg-party-azimio",  monogram: "bg-party-azimio-light text-party-azimio-text",  pill: "bg-party-azimio-light text-party-azimio-text border-party-azimio/30" },
  odm:    { bar: "bg-party-azimio",  border: "border-l-party-azimio",  dot: "bg-party-azimio",  monogram: "bg-party-azimio-light text-party-azimio-text",  pill: "bg-party-azimio-light text-party-azimio-text border-party-azimio/30" },
};

const NEUTRAL_THEME = {
  bar: "bg-party-neutral", border: "border-l-party-neutral", dot: "bg-party-neutral",
  monogram: "bg-party-neutral-light text-party-neutral-text",
  pill: "bg-party-neutral-light text-party-neutral-text border-party-neutral/30",
};

function getTheme(party) {
  if (!party) return NEUTRAL_THEME;
  const lower = party.toLowerCase();
  const key = Object.keys(PARTY_THEMES).find(k => lower.includes(k));
  return key ? PARTY_THEMES[key] : NEUTRAL_THEME;
}

// Returns up to 2 initials from a candidate's name for the monogram avatar
function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

// Filled/empty star display for a 0–5 rating
function Stars({ rating }) {
  if (rating === null || rating === undefined) {
    return <span className="text-xs text-gray-400 italic">No ratings yet</span>;
  }
  const filled = Math.round(rating);
  return (
    <span aria-label={`${rating} out of 5 stars`} className="flex items-center gap-1">
      <span>
        {[1,2,3,4,5].map(n => (
          <span key={n} className={n <= filled ? "text-amber-400" : "text-gray-200"}>★</span>
        ))}
      </span>
      <span className="text-xs font-semibold text-gray-600">{rating.toFixed(1)}</span>
    </span>
  );
}

// Election countdown banner — hides automatically once the election has passed
function ElectionCountdown() {
  const diff = ELECTION_DATE - new Date();
  if (diff <= 0) return null;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return (
    <div className="flex items-start gap-3 bg-amber/20 border border-amber/40 rounded-xl px-4 py-3 mb-5">
      <span className="text-xl mt-0.5" aria-hidden="true">🗳️</span>
      <div>
        <p className="text-sm font-bold text-ink">
          {days} days until the Kenya General Election
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          This venue is a registered civic centre. Use the Voter Guide below to make an informed choice.
        </p>
      </div>
    </div>
  );
}

// At-a-glance comparison chart — card-based rows sorted highest-first.
// Each row: rank · monogram · name + party pill | party-coloured bar · score
// Clicking a row toggles reviews open below the chart.
function ComparisonChart({ candidates, maxRating, onSelect, selectedId }) {
  const sorted = [...candidates].sort(
    (a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0)
  );

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Community rating comparison
      </p>
      <ul className="flex flex-col gap-2">
        {sorted.map((c, rank) => {
          const theme      = getTheme(c.party);
          const pct        = maxRating > 0 && c.average_rating !== null
                               ? Math.round((c.average_rating / maxRating) * 100) : 0;
          const isSelected = c.id === selectedId;

          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(isSelected ? null : c.id)}
                aria-expanded={isSelected}
                aria-label={`${c.name} — ${c.average_rating ?? "unrated"} stars. Click to ${isSelected ? "collapse" : "expand"} reviews.`}
                className={`
                  w-full text-left group border rounded-xl p-3
                  transition-all duration-200
                  ${isSelected
                    ? "bg-white border-slate-300 shadow-md"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"}
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <span className="text-xs font-bold text-gray-300 w-4 shrink-0 text-center select-none">
                    {rank + 1}
                  </span>

                  {/* Monogram avatar — coloured from tailwind.config.js party token */}
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none ${theme.monogram}`}
                    aria-hidden="true"
                  >
                    {initials(c.name)}
                  </span>

                  {/* Name + party pill + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-sm font-semibold truncate transition-colors ${isSelected ? "text-forest" : "text-ink group-hover:text-forest"}`}>
                        {c.name}
                      </span>
                      {c.party && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${theme.pill}`}>
                          {c.party}
                        </span>
                      )}
                    </div>
                    {/* Party-coloured bar on slate-100 track */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${theme.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500 shrink-0 w-8 text-right">
                        {c.average_rating !== null ? c.average_rating.toFixed(1) : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Review count + chevron */}
                  <div className="flex flex-col items-end shrink-0 gap-0.5">
                    <span className="text-xs text-gray-400">
                      {c.review_count ?? 0} review{c.review_count !== 1 ? "s" : ""}
                    </span>
                    <span className={`text-xs font-semibold transition-colors ${isSelected ? "text-forest" : "text-gray-300 group-hover:text-forest"}`}>
                      {isSelected ? "▲" : "▼"}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-gray-300 mt-2 text-right">
        Bars scaled to highest-rated · click any row to read reviews
      </p>
    </div>
  );
}

/*
 * VoterEduPanel
 * Renders a Voter Guide on civic-tagged venue detail pages.
 * Shows an election countdown, candidate scorecards with rating comparison bars,
 * and an expandable per-candidate review panel.
 *
 * Data flow: Browser → our API (/venues/:slug/civic) → Group 11 Voter Edu API
 * The partner URL never reaches the browser.
 *
 * Props:
 *  - slug {string}  The venue slug, used to scope the proxy route.
 *
 * Used by: VenueDetail.jsx (only when venue.isCivic === true)
 */
export default function VoterEduPanel({ slug }) {
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidatesError, setCandidatesError] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);

  // Fetch candidates for this civic venue on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setCandidatesLoading(true);
      setCandidatesError(false);
      try {
        const res = await fetch(`${API_BASE}/venues/${slug}/civic`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setCandidates(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCandidatesError(true);
      } finally {
        if (!cancelled) setCandidatesLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  // Fetch reviews when a candidate is selected; collapse if same candidate clicked again
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    async function load() {
      setReviewsLoading(true);
      setReviewsError(false);
      setReviews([]);
      try {
        const res = await fetch(
          `${API_BASE}/venues/${slug}/civic/candidates/${selectedId}/reviews`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setReviews(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setReviewsError(true);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedId, slug]);

  // Highest rating in the list — used to scale comparison bars relative to each other
  const maxRating = Math.max(0, ...candidates.map(c => c.average_rating ?? 0));

  if (candidatesLoading) {
    return (
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <ElectionCountdown />
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">🗳️ Voter Guide</h2>
        <p className="text-sm text-gray-400">Loading candidates…</p>
      </section>
    );
  }

  if (candidatesError) {
    return (
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <ElectionCountdown />
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">🗳️ Voter Guide</h2>
        <p className="text-sm text-gray-400">Candidate information is unavailable right now. Please try again later.</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5">
      <ElectionCountdown />

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">🗳️ Voter Guide</h2>
        <p className="text-xs text-gray-400 mt-1">
          Community ratings and reviews for presidential candidates. Select a candidate to read what voters are saying.
        </p>
      </div>

      {candidates.length === 0 ? (
        <p className="text-sm text-gray-400">No candidates available.</p>
      ) : (
        <>
        <ComparisonChart
          candidates={candidates}
          maxRating={maxRating}
          onSelect={setSelectedId}
          selectedId={selectedId}
        />
          {/* Expanded reviews — shown below the chart for the selected candidate */}
          {selectedId && (() => {
            const sel = candidates.find(c => c.id === selectedId);
            if (!sel) return null;
            const theme = getTheme(sel.party);
            return (
              <div className={`rounded-xl border border-l-4 ${theme.border} border-slate-100 p-4`}>
                {/* Selected candidate header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${theme.monogram}`} aria-hidden="true">
                    {initials(sel.name)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink leading-tight">{sel.name}</p>
                    <Stars rating={sel.average_rating} />
                  </div>
                </div>

                {reviewsLoading ? (
                  <div className="flex flex-col gap-2 animate-pulse">
                    {[1,2].map(n => <div key={n} className="h-10 bg-slate-100 rounded-lg" />)}
                  </div>
                ) : reviewsError ? (
                  <p className="text-sm text-gray-400">Reviews are unavailable right now.</p>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-gray-400">No reviews yet for this candidate.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {reviews.map((review) => (
                      <li key={review.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <Stars rating={review.rating} />
                          <span className="text-xs text-gray-400">{review.user} · {review.date}</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })()}
        </>
      )}

      <p className="text-xs text-gray-300 mt-5 pt-4 border-t border-gray-100">
        Candidate data provided by Voter Edu (Group 11) via the AccessMap Nairobi civic integration.
        AccessMap Nairobi is not affiliated with any political party.
      </p>
    </section>
  );
}
