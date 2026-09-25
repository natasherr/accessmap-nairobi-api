import { Star } from 'lucide-react'

/*
 * StarRating
 * A display-only star rating component — it shows a rating visually but
 * cannot be clicked or changed by the user.
 * Supports full stars and half stars for accurate average display.
 *
 * Props:
 *  - rating   {number}  The rating to display e.g. 3.7 (usually an average)
 *  - maxStars {number}  Total number of stars to show — defaults to 5
 *  - size     {string}  'lg' for a larger display on the Venue Detail page,
 *                       'sm' for smaller display on Venue Cards
 *
 * Used by: VenueCard.jsx, VenueDetail.jsx
 */
export default function StarRating({ rating, maxStars = 5, size = 'sm' }) {

  // Determine the icon size in pixels based on the size prop
  const iconSize = size === 'lg' ? 22 : 16

  /*
   * Build an array of star states based on the float rating.
   * Each star is one of three states: full, half, or empty.
   * Example: a rating of 3.7 produces ['full', 'full', 'full', 'half', 'empty']
   */
  const stars = Array.from({ length: maxStars }, (_, i) => {
    const position = i + 1
    if (rating >= position) return 'full'
    if (rating >= position - 0.5) return 'half'
    return 'empty'
  })

  return (
    <div
      role="img"
      aria-label={`${rating} out of ${maxStars} stars`}
      className="inline-flex items-center gap-0.5"
    >
      {stars.map((type, i) => (
        <span key={i} className="relative inline-block" aria-hidden="true">

          {/* Base layer: an empty grey star always rendered underneath */}
          <Star
            size={iconSize}
            className="text-gray-300"
            fill="none"
            strokeWidth={1.5}
          />

          {/* Overlay layer: an amber filled star placed on top of the grey one.
              For a half star, the overlay is clipped to 50% width so only
              the left half of the amber star shows through. */}
          {type !== 'empty' && (
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: type === 'half' ? '50%' : '100%' }}
            >
              <Star
                size={iconSize}
                className="text-amber"
                fill="#F5A623"
                strokeWidth={1.5}
              />
            </span>
          )}
        </span>
      ))}
    </div>
  )
}