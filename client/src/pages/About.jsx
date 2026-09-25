import { Heart, Share2 } from "lucide-react";

/*
 * About
 * Explains the purpose of AccessMap Nairobi, shows disability statistics
 * from Kenya, outlines how the app works in four steps, and provides
 * a WhatsApp share button to help spread awareness.
 *
 * Route: /about
 */
export default function About() {

  // Opens a pre-filled WhatsApp message with the app link in a new tab
  function shareOnWhatsApp() {
    const text = encodeURIComponent("AccessMap Nairobi - Find accessible venues in Nairobi!\n\n" + window.location.origin);
    window.open("https://wa.me/?text=" + text, "_blank");
  }

  // Disability statistics displayed in the Disability in Kenya section
  const stats = [
    { val: "2.2M+",   label: "Kenyans living with a disability (KNBS 2019)" },
    { val: "5.1%",    label: "Of the total population" },
    { val: "1 in 20", label: "Kenyans affected" },
  ];

  // The four steps shown in the How it works section
  const steps = [
    { n: "1", t: "Search", d: "Use the search bar or filter sidebar to find venues in your area of Nairobi." },
    { n: "2", t: "Read",   d: "Open a venue to see its accessibility features and read community reports from real visitors." },
    { n: "3", t: "Report", d: "Visited a venue? Submit a report, tick the features you saw, leave a short description, give a star rating." },
    { n: "4", t: "Share",  d: "Share specific venue pages or the whole site on WhatsApp to help your community." },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">

      <h1 className="text-3xl font-bold text-ink mb-2">About AccessMap Nairobi</h1>
      <p className="text-gray-500 mb-10">What we are, why we exist, and how to help.</p>

      {/* Mission statement */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-forest mb-3">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed">
          AccessMap Nairobi is a free, community-powered accessibility directory for Nairobi.
          People with disabilities and their carers can search for venues and see immediately
          whether each one has ramps, lifts, accessible toilets, and more.
        </p>
        <p className="text-gray-600 leading-relaxed mt-3">
          The data comes from the community — real visits, real observations.
          Anyone can submit a report in under two minutes.
        </p>
      </section>

      {/* Disability statistics from Kenya National Bureau of Statistics */}
      <section className="bg-mint rounded-xl p-6 mb-10">
        <h2 className="text-lg font-semibold text-forest mb-4">Disability in Kenya</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {stats.map(function(item) {
            return (
              <div key={item.val} className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-forest mb-1">{item.val}</div>
                <div className="text-xs text-gray-500 leading-tight">{item.label}</div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Source: Kenya National Bureau of Statistics, 2019 Census.
        </p>
      </section>

      {/* Step by step guide on how to use the app */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-forest mb-4">How it works</h2>
        <ol className="space-y-4">
          {steps.map(function(item) {
            return (
              <li key={item.n} className="flex gap-4 items-start">
                <span className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {item.n}
                </span>
                <div>
                  <h3 className="font-semibold text-ink text-sm">{item.t}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.d}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* WhatsApp share section */}
      <section className="bg-ink text-white rounded-xl p-6 text-center">
        <Heart size={28} className="mx-auto text-amber mb-3" />
        <h2 className="font-bold text-lg mb-2">Help spread the word</h2>
        <p className="text-gray-300 text-sm mb-4">
          The more people who know about AccessMap Nairobi, the more useful it becomes for the whole community.
        </p>
        <button
          onClick={shareOnWhatsApp}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          <Share2 size={16} />
          Share on WhatsApp
        </button>
      </section>

    </main>
  );
}