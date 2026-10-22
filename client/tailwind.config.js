/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Party colour classes used dynamically in VoterEduPanel.jsx.
    // Tailwind can't detect these at build time because they are assembled
    // at runtime from the PARTY_THEMES map, so we force-include them here.
    'bg-party-uda', 'border-l-party-uda', 'bg-party-uda-light', 'text-party-uda-text',
    'bg-party-azimio', 'border-l-party-azimio', 'bg-party-azimio-light', 'text-party-azimio-text',
    'bg-party-neutral', 'border-l-party-neutral', 'bg-party-neutral-light', 'text-party-neutral-text',
    'border-party-uda/30', 'border-party-azimio/30', 'border-party-neutral/30',
  ],
  theme: {
    extend: {
      colors: {
        // ── Core app palette ──────────────────────────────────────
        forest:   '#1B6B3A',
        amber:    '#F5A623',
        offwhite: '#FAFAF8',
        ink:      '#1A1A1A',
        mint:     '#E8F5EC',

        // ── Civic / Voter Guide — coalition identity colours ──────
        // Used by VoterEduPanel.jsx for party-branded bars, borders,
        // monogram avatars and pills. Add new coalitions here;
        // the component reads these token names directly.
        'party-uda': {
          DEFAULT: '#FACC15', // UDA yellow  — Kenya Kwanza / UDA
          light:   '#FEF9C3',
          text:    '#854D0E',
        },
        'party-azimio': {
          DEFAULT: '#22D3EE', // Wiper blue  — Azimio la Umoja / ODM / Wiper
          light:   '#CFFAFE',
          text:    '#155E75',
        },
        'party-neutral': {
          DEFAULT: '#94A3B8', // Slate       — Independent / unknown
          light:   '#F1F5F9',
          text:    '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}