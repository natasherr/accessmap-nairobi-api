import { Search, X } from 'lucide-react'

/*
 * SearchBar
 * A controlled text input used to filter venues by name, area, or category.
 * The parent component (Directory.jsx) owns the search value and passes it
 * down via props. Every keystroke calls onChange so the directory updates live.
 *
 * Props:
 *  - value       {string}    Current search text (controlled by Directory.jsx)
 *  - onChange    {function}  Called with the new string on every keystroke
 *  - placeholder {string}    Input placeholder text (has a default value)
 *
 * Used by: Directory.jsx
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search venues by name or area...',
}) {
  return (
    <div className="relative w-full">

      {/* Hidden label for screen readers — not visible on screen
      <label htmlFor="venue-search" className="sr-only">
        Search venues
      </label>

      {/* Search icon on the left side of the input — decorative only */}
      <Search
        size={16}
        aria-hidden="true"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />

      {/* Main text input.
          type="text" is used instead of type="search" to prevent the browser
          from adding its own native clear button, which would cause two clear
          buttons to appear at the same time. */}
      <input
        id="venue-search"
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search venues"
        className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200
                   bg-white text-sm text-ink placeholder-gray-400
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-forest
                   focus-visible:border-forest transition-colors"
      />

      {/* Clear button — only appears when the input has text.
          Clicking it resets the search value to an empty string,
          which clears the filter and shows all venues again. */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2
                     inline-flex items-center gap-1 text-gray-400 hover:text-ink transition-colors
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded"
        >
          <X size={14} aria-hidden="true" />
          <span className="text-xs">Clear</span>
        </button>
      )}
    </div>
  )
}