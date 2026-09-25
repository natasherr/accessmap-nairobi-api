import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, MapPin } from "lucide-react";

/*
 * Navbar
 * The main navigation bar shown at the top of every page.
 * Contains the app logo, desktop navigation links, and a mobile hamburger menu.
 * Uses NavLink from React Router to automatically highlight the active page link.
 */
export default function Navbar() {
  // Controls whether the mobile dropdown menu is open or closed
  const [menuOpen, setMenuOpen] = useState(false);

  /*
   * linkClass
   * Returns the correct Tailwind classes for a navigation link
   * depending on whether it is the currently active page or not.
   * Passed as a function to NavLink's className prop.
   */
  const linkClass = ({ isActive }) =>
    isActive
      ? "text-white transition-all duration-300 hover:-translate-y-0.5"
      : "text-white/80 hover:text-white transition-all duration-300 hover:-translate-y-0.5";

  return (
    // Outer wrapper — sits at the top of the page, full width
    <div className="relative top-0 left-0 right-0 z-50 bg-forest border-b border-white/10">

      {/* Inner container — centers content and adds horizontal padding */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

        {/* Logo — clicking it takes the user back to the home page */}
        <Link
          to="/"
          className="flex items-center gap-2 text-white font-bold text-xl transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
        >
          <MapPin size={24} className="text-amber transition-transform duration-300 hover:rotate-12" aria-hidden="true" />
          <span>AccessMap Nairobi</span>
        </Link>

        {/* Desktop navigation links — hidden on small screens, visible on md and above */}
        <div className="hidden md:flex items-center gap-6 text-base">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/directory" className={linkClass}>Directory</NavLink>
          <NavLink to="/about" className={linkClass}>About</NavLink>

          {/* Report a Venue button — styled differently to stand out as a call to action */}
          <NavLink
            to="/report"
            className="group bg-amber text-ink px-4 py-2 rounded-full text-base font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber/40 hover:bg-yellow-400 active:translate-y-0"
          >
            + Report a Venue
          </NavLink>
        </div>

        {/* Hamburger button — only visible on small screens.
            Toggles the mobile dropdown menu open and closed. */}
        <button
          className="md:hidden text-white transition-all duration-300 hover:scale-110 active:scale-95"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown menu — only renders when menuOpen is true.
          Each link closes the menu when clicked by setting menuOpen to false. */}
      {menuOpen && (
        <div className="md:hidden bg-forest/70 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex flex-col gap-3 text-base">
          <NavLink to="/" end className={linkClass} onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/directory" className={linkClass} onClick={() => setMenuOpen(false)}>Directory</NavLink>
          <NavLink to="/about" className={linkClass} onClick={() => setMenuOpen(false)}>About</NavLink>
          <NavLink
            to="/report"
            className="bg-amber text-ink px-4 py-2 rounded-full text-base font-medium text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:bg-yellow-400 active:translate-y-0"
            onClick={() => setMenuOpen(false)}
          >
            + Report a Venue
          </NavLink>
        </div>
      )}
    </div>
  );
}