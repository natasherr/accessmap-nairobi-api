import { useEffect, useState } from "react";

const API_BASE = "https://accessmap-nairobi-api-1.onrender.com/api";

/*
 * VoterEduPanel
 * Renders a Voter Guide section on venue detail pages that are tagged isCivic.
 * Fetches candidates from the venue-scoped civic proxy route on our own backend,
 * which in turn calls the Group 11 Voter Edu API — keeping the partner URL
 * server-side only, never exposed to the browser.
 *
 * Props:
 *  - slug {string}  The venue slug, used to scope the proxy route.
 *
 * Used by: VenueDetail.jsx (only rendered when venue.isCivic === true)
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
      } catch (err) {
        if (!cancelled) setCandidatesError(true);
      } finally {
        if (!cancelled) setCandidatesLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  // Fetch reviews when a candidate is selected
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
      } catch (err) {
        if (!cancelled) setReviewsError(true);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedId, slug]);

  if (candidatesLoading) {
    return (
      <section className="voter-edu-panel">
        <h2>Voter Guide</h2>
        <p>Loading candidates…</p>
      </section>
    );
  }

  if (candidatesError) {
    return (
      <section className="voter-edu-panel">
        <h2>Voter Guide</h2>
        <p>Candidate information is unavailable right now. Please try again later.</p>
      </section>
    );
  }

  return (
    <section className="voter-edu-panel">
      <h2>Voter Guide</h2>

      {candidates.length === 0 ? (
        <p>No candidates available.</p>
      ) : (
        <ul className="candidate-list">
          {candidates.map((candidate) => {
            const isSelected = candidate.id === selectedId;
            return (
              <li key={candidate.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(candidate.id)}
                  aria-pressed={isSelected}
                  className={isSelected ? "candidate selected" : "candidate"}
                >
                  <strong>{candidate.name}</strong>
                  {candidate.party ? <span> — {candidate.party}</span> : null}
                  <span> · Rating: {candidate.average_rating ?? "No rating yet"}</span>
                  <span> · Reviews: {candidate.review_count ?? 0}</span>
                </button>

                {isSelected && (
                  <div className="reviews-panel">
                    {reviewsLoading ? (
                      <p>Loading reviews…</p>
                    ) : reviewsError ? (
                      <p>Reviews are unavailable right now.</p>
                    ) : reviews.length === 0 ? (
                      <p>No reviews yet for this candidate.</p>
                    ) : (
                      <ul>
                        {reviews.map((review) => (
                          <li key={review.id}>
                            <strong>{review.rating}/5</strong> — {review.text}
                            <br />
                            <small>{review.user} · {review.date}</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
