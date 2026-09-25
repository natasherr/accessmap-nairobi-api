import { Link } from 'react-router-dom'
import { MapPin, FileText } from 'lucide-react'
import { BADGES } from '../constants/badges'
import AccessBadge from './AccessBadge'
import StarRating from './StarRating'

/*
 * VenueCard
 * Displays a summary of a single venue in the directory listing.
 * Shows the venue name, area, category, average star rating,
 * accessibility badges, and buttons to view details or get directions.
 *
 * Props:
 *  - venue    {object}  A single venue object from localStorage
 *  - reports  {array}   All community reports for this venue,
 *                       filtered by venueId before being passed in
 *
 * Used by: Directory.jsx
 */
export default function VenueCard({ venue, reports }) {

  /*
   * Calculate the average star rating from all reports for this venue.
   * Rounded to one decimal place e.g. 3.666 becomes 3.7.
   * Returns null if there are no reports yet.
   */
  const avgRating =
    reports.length > 0
      ? Math.round(
          (reports.reduce((sum, r) => sum + r.rating, 0) / reports.length) * 10
        ) / 10
      : null

  /*
   * Build a Google Maps search URL using the venue name.
   * Opens in a new tab when the user clicks Directions.
   * No Maps API key is needed for a basic search URL.
   */
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    venue.name + ' Nairobi'
  )}`

  return (
    <article
      className="bg-white rounded-2xl shadow-sm border border-gray-100 
                 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 hover:border-forest/20
                 transition-all duration-300 focus-within:ring-2 focus-within:ring-forest 
                 flex flex-col group"
      aria-label={`Venue: ${venue.name}`}
    >
      {/* Top section — venue name, area, category, and average rating */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            {/* Venue name — turns forest green on card hover using the group class */}
            <h3 className="text-base font-semibold text-ink leading-tight group-hover:text-forest transition-colors duration-300">
              {venue.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
              <MapPin size={13} aria-hidden="true" />
              {venue.area} · {venue.category}
            </p>
          </div>

          {/* Star rating — shows average and report count, or a placeholder if no reports */}
          <div className="flex flex-col items-end shrink-0">
            {avgRating !== null ? (
              <>
                <StarRating rating={avgRating} size="sm" />
                <span className="text-xs text-gray-400 mt-0.5">
                  {avgRating} · {reports.length}{' '}
                  {reports.length === 1 ? 'report' : 'reports'}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">No ratings yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Middle section — accessibility feature badges.
          Each badge shows whether the feature is present or not. */}
      <div className="p-4 flex-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Accessibility features
        </p>
        <div className="flex flex-wrap gap-1.5">
          {BADGES.map(badge => (
            <AccessBadge
              key={badge.key}
              emoji={badge.emoji}
              label={badge.label}
              colorClass={badge.colorClass}
              isPresent={venue.accessibility[badge.key]}
            />
          ))}
        </div>
      </div>

      {/* Bottom section — action buttons */}
      <div className="p-4 pt-0 flex gap-2">

        {/* View Details — navigates to the full venue page using the slug URL */}
        <Link
          to={`/venue/${venue.slug}`}
          className="flex-1 text-center text-sm font-medium bg-forest text-white rounded-xl py-2 px-3 
                     hover:bg-green-800 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest/30
                     transition-all duration-300 focus:outline-none focus-visible:ring-2 
                     focus-visible:ring-forest focus-visible:ring-offset-2"
        >
          View Details
        </Link>

        {/* Directions — opens Google Maps in a new tab */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Get directions to ${venue.name} on Google Maps`}
          className="flex items-center gap-1 text-sm font-medium border border-forest text-forest 
                     rounded-xl py-2 px-3 hover:bg-forest hover:text-white hover:-translate-y-0.5
                     hover:shadow-lg hover:shadow-forest/30
                     transition-all duration-300 focus:outline-none focus-visible:ring-2 
                     focus-visible:ring-forest focus-visible:ring-offset-2"
        >
          <MapPin size={14} aria-hidden="true" />
          Directions
        </a>
      </div>

      {/* Report count footer — only shown if at least one report exists */}
      {reports.length > 0 && (
        <div className="px-4 pb-3 flex items-center gap-1 text-xs text-gray-400">
          <FileText size={12} aria-hidden="true" />
          {reports.length} community {reports.length === 1 ? 'report' : 'reports'} submitted
        </div>
      )}
    </article>
  )
}