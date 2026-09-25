import { SlidersHorizontal, X } from 'lucide-react'
import { BADGES } from '../constants/badges'
import { NAIROBI_AREAS } from '../constants/areas'

/*
 * FilterSidebar
 * Shows a panel of filter controls for the venue directory.
 * When the user changes any filter, the full updated filters object
 * is passed back to Directory.jsx via the onChange prop, which then
 * re-runs filterVenues() to update the results.
 *
 * Props:
 *  - filters   {object}    Current filter state owned by Directory.jsx:
 *                          { searchText, area, badges, minRating, sortBy }
 *  - onChange  {function}  Called with the full updated filters object on any change
 *
 * Used by: Directory.jsx
 * Imports from: constants/badges.js, constants/areas.js
 */

// Sort options shown in the Sort By dropdown.
// These values must match the sortBy cases in utils/filters.js exactly.
const SORT_OPTIONS = [
  { value: 'recent',        label: 'Most recently added' },
  { value: 'highest-rated', label: 'Highest rated' },
  { value: 'most-reports',  label: 'Most reports' },
  { value: 'alphabetical',  label: 'Alphabetical' },
]

// Venue categories available in the Category dropdown.
const CATEGORIES = [
  'hospital',
  'market',
  'office',
  'school',
  'transport',
  'other',
]

// Default filter state — exported so Directory.jsx can reset to these values.
// Keys must match what filterVenues() in utils/filters.js expects.
export const DEFAULT_FILTERS = {
  searchText: '',
  area:       'All areas',
  badges:     [],
  minRating:  0,
  sortBy:     'recent',
}

export default function FilterSidebar({ filters, onChange }) {

  // Updates a single filter key while keeping all other keys unchanged.
  function update(key, value) {
    onChange({ ...filters, [key]: value })
  }

  // Adds a badge key to the active badges array if it isn't there yet,
  // or removes it if it already is (toggle behaviour).
  function toggleBadge(key) {
    const already = filters.badges.includes(key)
    const updated = already
      ? filters.badges.filter(b => b !== key)
      : [...filters.badges, key]
    update('badges', updated)
  }

  // Count how many filters are currently active.
  // Used to show a badge number on the mobile filter toggle button.
  const activeCount = [
    filters.area !== 'All areas',
    filters.badges.length > 0,
    filters.minRating > 0,
    filters.sortBy !== 'recent',
  ].filter(Boolean).length

  return (
    <aside
      aria-label="Filter venues"
      className="bg-white rounded-2xl border border-gray-100
                 shadow-sm p-5 flex flex-col gap-5"
    >
      {/* Header — shows active filter count and a clear all button */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
          <SlidersHorizontal size={15} aria-hidden="true" />
          Filters
          {activeCount > 0 && (
            <span
              className="bg-forest text-white text-xs font-medium
                         px-2 py-0.5 rounded-full"
              aria-label={`${activeCount} active filters`}
            >
              {activeCount}
            </span>
          )}
        </h2>

        {/* Clear all button — only visible when at least one filter is active */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-xs text-gray-400 hover:text-ink flex items-center gap-1
                       focus:outline-none focus-visible:ring-2
                       focus-visible:ring-forest rounded transition-colors"
            aria-label="Clear all filters"
          >
            <X size={12} aria-hidden="true" />
            Clear all
          </button>
        )}
      </div>

      {/* Sort by dropdown */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="sort-select"
          className="text-xs font-medium text-gray-500 uppercase tracking-wide"
        >
          Sort by
        </label>
        <select
          id="sort-select"
          value={filters.sortBy}
          onChange={e => update('sortBy', e.target.value)}
          className="w-full text-sm text-ink border border-gray-200 rounded-xl
                     px-3 py-2 bg-white
                     focus:outline-none focus-visible:ring-2
                     focus-visible:ring-forest transition-colors"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Area dropdown — filters venues by Nairobi sub-area */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="area-select"
          className="text-xs font-medium text-gray-500 uppercase tracking-wide"
        >
          Area
        </label>
        <select
          id="area-select"
          value={filters.area}
          onChange={e => update('area', e.target.value)}
          className="w-full text-sm text-ink border border-gray-200 rounded-xl
                     px-3 py-2 bg-white
                     focus:outline-none focus-visible:ring-2
                     focus-visible:ring-forest transition-colors"
        >
          <option value="All areas">All areas</option>
          {NAIROBI_AREAS.map(area => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      {/* Category dropdown — filters venues by type e.g. hospital, school */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="category-select"
          className="text-xs font-medium text-gray-500 uppercase tracking-wide"
        >
          Category
        </label>
        <select
          id="category-select"
          value={filters.category || 'all'}
          onChange={e => update('category', e.target.value)}
          className="w-full text-sm text-ink border border-gray-200 rounded-xl
                     px-3 py-2 bg-white
                     focus:outline-none focus-visible:ring-2
                     focus-visible:ring-forest transition-colors"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Minimum rating slider — 0 means any rating, 5 means 5 stars only */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span
            id="rating-label"
            className="text-xs font-medium text-gray-500 uppercase tracking-wide"
          >
            Minimum rating
          </span>
          <span className="text-xs font-semibold text-forest">
            {filters.minRating > 0 ? `★ ${filters.minRating}+` : 'Any'}
          </span>
        </div>
        <input
          type="range"
          id="min-rating"
          min={0}
          max={5}
          step={1}
          value={filters.minRating}
          onChange={e => update('minRating', Number(e.target.value))}
          aria-labelledby="rating-label"
          aria-valuetext={
            filters.minRating > 0 ? `${filters.minRating} stars and above` : 'Any rating'
          }
          className="w-full accent-forest cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-300 select-none">
          <span>Any</span>
          <span>★5</span>
        </div>
      </div>

      {/* Accessibility feature checkboxes — user can select multiple badges to filter by.
          Only venues that have ALL selected badges will be shown in the results. */}
      <fieldset>
        <legend
          id="features-legend"
          className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3"
        >
          Accessibility features
        </legend>
        <div
          className="flex flex-col gap-2"
          aria-describedby="features-legend"
        >
          {BADGES.map(badge => {
            const isChecked = filters.badges.includes(badge.key)
            return (
              <label
                key={badge.key}
                className={`flex items-center gap-2.5 cursor-pointer
                            rounded-xl px-3 py-2 transition-colors
                            ${isChecked ? 'bg-mint' : 'hover:bg-gray-50'}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleBadge(badge.key)}
                  className="accent-forest w-4 h-4 cursor-pointer
                             focus:outline-none focus-visible:ring-2
                             focus-visible:ring-forest rounded"
                />
                <span aria-hidden="true">{badge.emoji}</span>
                <span className="text-sm text-ink">{badge.label}</span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </aside>
  )
}