import { useVenues } from "../context/VenuesContext"
import { useReports } from "../context/ReportsContext"
import { MapPin, FileText, CheckCircle } from "lucide-react"

/*
 * StatsCounter
 * Displays three live statistics on the home page:
 * - Total number of venues listed
 * - Total number of community reports submitted
 * - Total number of accessibility features recorded across all venues
 *
 * All counts are derived from the shared VenuesContext and ReportsContext,
 * so they update automatically whenever a venue or report is added
 * anywhere in the app — no refresh needed, no localStorage involved.
 *
 * Used by: Home.jsx
 */
export default function StatsCounter() {
  const { venues } = useVenues()
  const { reports } = useReports()

  const featureKeys = [
    "ramp", "lift", "accessibleToilet", "accessibleParking",
    "tactilePaving", "wideCorridors", "audioAssistance", "staffAssistance"
  ]

  let featureCount = 0
  venues.forEach(venue => {
    featureKeys.forEach(key => {
      if (venue.accessibility?.[key]) featureCount++
    })
  })

  const items = [
    { icon: MapPin,      label: "Venues Listed",          value: venues.length,  color: "text-forest" },
    { icon: FileText,    label: "Community Reports",       value: reports.length, color: "text-amber"  },
    { icon: CheckCircle, label: "Accessibility Features",  value: featureCount,   color: "text-forest" },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map(({ icon: Icon, label, value, color }) => (
        <div
          key={label}
          className="bg-white rounded-xl border border-gray-100 p-5 text-center shadow-sm"
        >
          <Icon size={28} className={`${color} mx-auto mb-2`} aria-hidden="true" />
          <div className="text-3xl font-bold text-ink">{value}</div>
          <div className="text-sm text-gray-500 mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}