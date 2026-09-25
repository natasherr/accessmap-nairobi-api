import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Printer, MapPin } from 'lucide-react'
import { useVenues } from '../context/VenuesContext'
import { useReports } from '../context/ReportsContext'
import { BADGES } from '../constants/badges'
import { motion } from 'framer-motion'

/*
 * VenueDetail
 * Shows the full profile of a single venue including its name, address,
 * area, category, accessibility features, average rating, and all
 * community reports submitted for that venue.
 * Also provides buttons to get directions on Google Maps and print the page.
 *
 * Route: /venue/:slug
 * The slug from the URL is used to look up the venue via getVenueBySlug().
 */

// Maps a numeric star rating to a readable label
const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent'
};

/*
 * Stars
 * A simple display component that renders a row of star characters.
 * Filled stars are shown in amber, empty stars in light gray.
 * Used for both the venue average rating and individual report ratings.
 */
function Stars({ rating, size = 'text-lg' }) {
  return (
    <span className={size}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={
            n <= Math.round(rating)
              ? 'text-amber-400'
              : 'text-gray-200'
          }
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function VenueDetail() {
  // The slug comes from the URL e.g. /venue/kenyatta-national-hospital
  const { id: slug } = useParams()
  const { venues, getVenueBySlug } = useVenues()
  const { getReportsByVenueId, getAverageRating } = useReports()

  // Holds the venue object once it is found — null while loading
  const [venue, setVenue] = useState(null)

  // Look up the venue by slug whenever the venues list or slug changes
  useEffect(() => {
    if (slug) setVenue(getVenueBySlug(slug))
  }, [venues, slug])

  // Show a loading message while the venue is being fetched
  if (!venue) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Loading venue...
    </div>
  )

  // Get all reports for this venue, sorted newest first
  const venueReports = getReportsByVenueId(venue.id)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

  const avgRating = getAverageRating(venue.id)

  // Only the badges that are marked true for this venue
  const activeBadges = BADGES.filter(b => venue.accessibility[b.key])

  // Build a Google Maps directions URL using the venue coordinates
  const directionsUrl = venue.coordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${venue.coordinates.lat},${venue.coordinates.lng}`
    : null

  return (
    <div className="min-h-screen bg-[#E8F5EC] p-8">
      {/* Decorative radial gradients in the background — visual only */}
      <div className="absolute pointer-events-none blur-2xl inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(27,107,58,0.35),transparent_30%)]"></div>
      <div className="absolute pointer-events-none blur-2xl inset-0 bg-[radial-gradient(circle_at_top_right,rgba(27,66,58,0.35),transparent_30%)]"></div>

      {/* Page content fades in from below on load */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }} className="max-w-3xl mx-auto">
        <div className="max-w-3xl mx-auto">

          {/* Venue header — name, address, area, category, and action buttons */}
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap print:block">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{venue.address}</p>
              <p className="text-sm text-gray-700">{venue.area}</p>
              <p className="text-xs text-gray-900 uppercase tracking-wide mt-1">{venue.category}</p>
            </div>
            <div className="flex gap-2 print:hidden">
              {/* Directions button — only shown if the venue has coordinates */}
              {directionsUrl && (
                <a href={directionsUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B6B3A] text-white text-sm font-semibold rounded-lg hover:bg-[#FAFAF8] hover:text-gray-900 transition-colors">
                  <MapPin className="w-4 h-4" /> Get directions
                </a>
              )}
              {/* Print button — triggers the browser print dialog */}
              <button onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>

          {/* Stats row — average rating, report count, and feature count */}
          <div className="grid grid-cols-3 gap-3 mb-6 text-white">
            <div className="bg-[#1B6B3A] rounded-xl p-4 text-center border border-gray-900">
              <div className="text-4xl font-bold">{avgRating ?? '—'}</div>
              {avgRating ?
                <Stars rating={avgRating} size="text-base" />
                : <p className="text-sm mt-1">No ratings yet</p>
              }
              <p className="text-sm mt-1">Average rating</p>
            </div>
            <div className="bg-[#1B6B3A] rounded-xl p-4 text-center border border-gray-900">
              <div className="text-4xl font-bold">{venueReports.length}</div>
              <p className="text-sm mt-1">Community report{venueReports.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-[#1B6B3A] rounded-xl p-4 text-center border border-gray-900">
              <div className="text-4xl font-bold">
                {activeBadges.length}<span className="text-sm font-normal">/{BADGES.length}</span>
              </div>
              <p className="text-sm mt-1">Accessibility features</p>
            </div>
          </div>

          {/* Accessibility features — present badges shown clearly, absent ones struck through */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 mb-6">
            <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Accessibility features</p>
            <div className="flex flex-wrap gap-4">
              {BADGES.map(b => {
                const on = venue.accessibility[b.key]
                return on ? (
                  <span key={b.key} className="text-sm px-2.5 py-1 rounded-lg font-medium"
                    style={{ background: b.colorClass.includes('green') ? '#D1FAE5' : undefined }}>
                    {b.emoji} {b.label}
                  </span>
                ) : (
                  <span key={b.key} className="text-sm px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 line-through">
                    {b.label}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Community reports — listed newest first */}
          <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Community reports</p>
          {venueReports.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-gray-100 text-center text-gray-600 text-sm">
              No reports yet — be the first to report this venue.
            </div>
          ) : (
            venueReports.map(r => {
              // Split badges into present and absent for this report
              const on = BADGES.filter(b => r.accessibility[b.key])
              const off = BADGES.filter(b => !r.accessibility[b.key])
              const dateStr = new Date(r.visitedAt + 'T12:00:00').toLocaleDateString('en-KE', {
                day: 'numeric', month: 'short', year: 'numeric'
              })
              return (
                <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Stars rating={r.rating} size="text-sm" />
                      <span className="text-sm font-semibold text-gray-700">{RATING_LABELS[r.rating]}</span>
                    </div>
                    <span className="text-xs text-gray-400">Visited {dateStr}</span>
                  </div>
                  {r.description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{r.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {on.map(b => (
                      <span key={b.key} className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.colorClass}`}>
                        {b.emoji} {b.label}
                      </span>
                    ))}
                    {off.map(b => (
                      <span key={b.key} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 line-through">
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })
          )}

        </div>
      </motion.div>
    </div>
  )
}