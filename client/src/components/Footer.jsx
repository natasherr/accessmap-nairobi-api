import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  FaHome,
  FaList,
  FaFlag,
  FaEnvelope,
  FaMapMarkerAlt,
  FaLeaf,
  FaHeart,
  FaArrowUp,
} from 'react-icons/fa';

/*
 * useScrollPosition
 * A custom hook that tracks how far the user has scrolled down the page.
 * Returns the current vertical scroll position in pixels.
 * Used to show or hide the back to top button.
 */
function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Update scrollY every time the user scrolls
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener when the component is removed from the page
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollY;
}

/*
 * Footer
 * Shown at the bottom of every page.
 * Contains the brand name, quick navigation links, contact details,
 * and a back to top button that appears after the user scrolls down 400px.
 */
function Footer() {
  const scrollY = useScrollPosition();

  // Smoothly scrolls the page back to the very top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer
        className="relative bg-gradient-to-br from-[#0a1a0a] via-[#1B6B3A] to-[#0a1a0a] text-white overflow-hidden"
        style={{
          boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* Decorative radial glow in the background — visual only */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 20% 30%, rgba(27,107,58,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Thin amber gradient line along the top edge of the footer */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 opacity-70" />

        <div className="relative max-w-7xl mx-auto px-6 py-12">

          {/* Three column grid: brand, quick links, contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-10">

            {/* Brand section — app name and short description */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FaLeaf className="text-amber-400 text-2xl" />
                <h2 className="text-2xl font-extrabold text-amber-400 tracking-tight">
                  AccessMap Nairobi
                </h2>
              </div>
              <p className="text-sm text-white/60 max-w-xs leading-relaxed">
                A community-powered directory helping everyone navigate Nairobi
                accessibly.
              </p>
            </div>

            {/* Quick links — each link scrolls to the top of the destination page */}
            <div>
              <h3 className="font-bold text-amber-400 text-lg mb-4 border-b border-white/10 pb-2">
                Quick Links
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to="/"
                    onClick={scrollToTop}
                    className="flex items-center gap-2 text-white/70 hover:text-amber-400 transition-all duration-200 hover:translate-x-1"
                  >
                    <FaHome className="text-amber-400/70" />
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/directory"
                    onClick={scrollToTop}
                    className="flex items-center gap-2 text-white/70 hover:text-amber-400 transition-all duration-200 hover:translate-x-1"
                  >
                    <FaList className="text-amber-400/70" />
                    Directory
                  </Link>
                </li>
                <li>
                  <Link
                    to="/report"
                    onClick={scrollToTop}
                    className="flex items-center gap-2 text-white/70 hover:text-amber-400 transition-all duration-200 hover:translate-x-1"
                  >
                    <FaFlag className="text-amber-400/70" />
                    Submit a Report
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact section — location and email address */}
            <div>
              <h3 className="font-bold text-amber-400 text-lg mb-4 border-b border-white/10 pb-2">
                Contact
              </h3>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-center gap-3">
                  <FaMapMarkerAlt className="text-amber-400/70" />
                  <span>Nairobi, Kenya</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaEnvelope className="text-amber-400/70" />
                  <a
                    href="mailto:accessmapnairobi@gmail.com"
                    className="hover:text-amber-400 transition"
                  >
                    accessmapnairobi@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Horizontal divider line */}
          <hr className="border-white/10 mb-6" />

          {/* Bottom bar — copyright and credit */}
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-white/40 gap-2">
            <p>
              © {new Date().getFullYear()} AccessMap Nairobi. All rights
              reserved.
            </p>
            <p className="flex items-center gap-1">
              Built with <FaHeart className="text-red-400 animate-pulse" /> for
              Nairobi
            </p>
          </div>
        </div>
      </footer>

      {/* Back to top button — fixed at the bottom right of the screen.
          Only becomes visible after the user scrolls more than 400px down. */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-3 bg-amber-400 text-gray-900 rounded-full shadow-lg hover:bg-amber-300 transition-all duration-300 ${
          scrollY > 400 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
        aria-label="Back to top"
      >
        <FaArrowUp />
      </button>
    </>
  );
}

export default Footer;