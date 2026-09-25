/*
 * BADGES
 * Defines the 8 accessibility features that can be recorded for any venue.
 * Each badge has a unique key, a display label, an emoji, and a color class.
 *
 * - key        matches the field name in the venue and report accessibility objects
 * - label      shown as text next to the badge in the UI
 * - emoji      shown as an icon before the label
 * - colorClass Tailwind classes for the badge background and text color
 *
 * Used by: FilterSidebar.jsx, VenueCard.jsx, VenueDetail.jsx,
 *          ReportForm.jsx, AccessBadge.jsx
 */
export const BADGES = [
  {
    key: 'ramp',
    label: 'Ramp / step-free entry',
    emoji: '♿',
    colorClass: 'bg-green-100 text-green-800',
  },
  {
    key: 'lift',
    label: 'Lift / elevator',
    emoji: '🛗',
    colorClass: 'bg-blue-100 text-blue-800',
  },
  {
    key: 'accessibleToilet',
    label: 'Accessible toilet',
    emoji: '🚻',
    colorClass: 'bg-amber-100 text-amber-800',
  },
  {
    key: 'accessibleParking',
    label: 'Accessible parking',
    emoji: '🅿️',
    colorClass: 'bg-teal-100 text-teal-800',
  },
  {
    key: 'tactilePaving',
    label: 'Tactile paving',
    emoji: '🦯',
    colorClass: 'bg-purple-100 text-purple-800',
  },
  {
    key: 'wideCorridors',
    label: 'Wide corridors',
    emoji: '🦽',
    colorClass: 'bg-red-100 text-red-800',
  },
  {
    key: 'audioAssistance',
    label: 'Audio assistance',
    emoji: '🔊',
    colorClass: 'bg-gray-100 text-gray-800',
  },
  {
    key: 'staffAssistance',
    label: 'Staff assistance',
    emoji: '🧑‍🦽',
    colorClass: 'bg-pink-100 text-pink-800',
  },
]

/*
 * DEFAULT_ACCESSIBILITY
 * A template object with all 8 accessibility features set to false.
 * Used when creating a new venue or initializing a new report,
 * so every venue and report always has all 8 keys present.
 *
 * Used by: useVenues.js, ReportForm.jsx
 */
export const DEFAULT_ACCESSIBILITY = {
  ramp: false,
  lift: false,
  accessibleToilet: false,
  accessibleParking: false,
  tactilePaving: false,
  wideCorridors: false,
  audioAssistance: false,
  staffAssistance: false,
}