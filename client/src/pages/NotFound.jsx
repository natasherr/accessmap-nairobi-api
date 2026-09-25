import { Link } from 'react-router-dom'
import { MapPinOff, Home, ArrowLeft } from 'lucide-react'

/*
 * NotFound
 * Shown whenever a user visits a URL that does not match any route.
 * Provides two buttons: one to go home and one to go back to the previous page.
 *
 * Route: * (catch-all in App.jsx)
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1a0f] via-[#1a2e1a] to-[#0d1a0d] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Decorative blurred glow circles in the background — visual only */}
      <div className="absolute top-[-10%] right-[-5%] w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-500" />

      {/* Subtle dot grid pattern overlay — visual only */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #4ade80 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Floating dots — visual only */}
      <div className="absolute inset-0 opacity-[0.08]">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400 rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-emerald-400 rounded-full" />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-emerald-400 rounded-full" />
        <div className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-emerald-400 rounded-full" />
        <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
      </div>

      <div className="text-center max-w-2xl w-full relative z-10">

        {/* Icon with glow effect — scales and rotates on hover */}
        <div className="relative w-32 h-32 mx-auto mb-10 group">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-ping group-hover:animate-pulse" />
          <div
            className="relative w-full h-full rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 flex items-center justify-center shadow-2xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 backdrop-blur-sm border border-emerald-400/20"
            style={{ boxShadow: '0 20px 60px rgba(52, 211, 153, 0.15)' }}
          >
            <MapPinOff className="w-14 h-14 text-emerald-400 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" strokeWidth={1.5} />
          </div>
        </div>

        {/* Large 404 heading with animated gradient text */}
        <div className="mb-6 relative">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-300 bg-[length:200%] animate-gradient xl:text-[10rem]">
            404
          </h1>
          {/* Blurred copies of the 404 text create a glow effect behind it */}
          <div className="absolute inset-0 text-9xl font-bold text-emerald-500/5 blur-sm select-none xl:text-[10rem]">
            404
          </div>
          <div className="absolute inset-0 text-9xl font-bold text-emerald-400/5 blur-2xl select-none xl:text-[10rem]">
            404
          </div>
        </div>

        <h2 className="text-4xl font-bold text-white mb-4 animate-fade-in-up">
          Lost in the dark? 🌙
        </h2>

        <p className="text-emerald-200/80 text-lg leading-relaxed mb-10 max-w-md mx-auto animate-fade-in-up animation-delay-200">
          The page you're looking for has wandered into the shadows.
          Let's light the way back home.
        </p>

        {/* Action buttons — Go to Home and Go Back */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10 animate-fade-in-up animation-delay-400">
          <Link
            to="/"
            className="group relative px-10 py-4 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-base font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3 group-hover:gap-4 transition-all duration-300">
              <Home className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
              Go to Home
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-300 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          {/* Goes back to the previous page in browser history */}
          <button
            onClick={() => window.history.back()}
            className="group px-10 py-4 rounded-full border-2 border-emerald-400/30 text-emerald-300 text-base font-semibold hover:bg-emerald-400/10 hover:border-emerald-400/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="transition-all duration-300 group-hover:tracking-wide">Go Back</span>
          </button>
        </div>

        <p className="text-sm text-emerald-400/50 mt-8 font-mono tracking-wider animate-fade-in-up animation-delay-600 transition-colors duration-300 hover:text-emerald-400/70">
          Error 404 · Page Not Found
        </p>

        <p className="text-xs text-emerald-400/30 mt-3 animate-fade-in-up animation-delay-800 transition-all duration-300 hover:text-emerald-400/50 hover:scale-105 cursor-default">
          Hint: Even in the dark, the way home is always lit
        </p>
      </div>

      {/* Custom CSS animations for the gradient text and fade-in-up effects */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-gradient {
          animation: gradient 3s ease infinite;
        }

        .animate-fade-in-up {
          opacity: 0;
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-800 { animation-delay: 0.8s; }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  )
}