/**
 * AccessBadge
 * Renders a single accessibility feature as a pill badge.
 *
 * Props:
 *  - emoji      {string}  The emoji icon from BADGES e.g. '♿'
 *  - label      {string}  Human-readable name e.g. 'Ramp / step-free entry'
 *  - colorClass {string}  Tailwind classes from BADGES e.g. 'bg-green-100 text-green-800'
 *  - isPresent  {boolean} true = feature confirmed, false = not reported
 */
export default function AccessBadge({ emoji, label, colorClass, isPresent }) {
  return (
    <span
      role="status"
      aria-label={`${label}: ${isPresent ? 'present' : 'not reported'}`}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        ${isPresent ? colorClass : 'bg-gray-100 text-gray-400'}
      `}
    >
      <span aria-hidden="true">
        {emoji}
      </span>
      {label}
    </span>
  )
}