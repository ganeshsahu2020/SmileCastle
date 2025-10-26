// src/components/AppHeader.jsx
import { PanelsTopLeft } from 'lucide-react'

/**
 * AppHeader: small responsive top bar.
 * Props:
 *  - title       : left button label
 *  - onMenu      : click handler (open drawer)
 *  - brand       : right-side text
 *  - visibility  : 'mobile-only' | 'all'
 *  - rightAddon  : optional node rendered at far right (e.g., bell with unread)
 */
export default function AppHeader({
  title = 'Admin Panel',
  onMenu = () => {},
  brand = 'Smile Castle',
  visibility = 'mobile-only',
  rightAddon = null,
}) {
  const visibilityClass = visibility === 'all' ? 'block' : 'lg:hidden'

  return (
    <div
      className={`${visibilityClass} sticky top-0 z-50
                  border-b border-slate-200 bg-white/95
                  px-4 py-3 h-14
                  flex items-center justify-between
                  shadow-sm
                  pt-[env(safe-area-inset-top)]`}
      role="banner"
    >
      {/* Left: Menu + Title */}
      <button
        onClick={onMenu}
        className="inline-flex items-center gap-2
                  rounded-xl bg-slate-900 text-white
                  px-3 py-2 h-10
                  shadow transition hover:brightness-110
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        aria-haspopup="dialog"
        aria-expanded="false"
        aria-controls="app-drawer"
      >
        <PanelsTopLeft size={16} aria-hidden />
        <span className="font-semibold">{title}</span>
      </button>

      {/* Right: brand + optional addon */}
      <div className="flex items-center gap-3">
        {/* Inline SVG mark (no external files = no 404/500) */}
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 64 64"
            className="h-8 w-8 rounded-xl"
            aria-label="Smile Castle mark"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="scCape" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#A78BFA" />
                <stop offset="1" stopColor="#60A5FA" />
              </linearGradient>
            </defs>
            <path d="M8 36c10-6 20-6 32-2 8 2 12 2 16-1v8c-6 3-12 3-18 2-12-2-20 1-30 6z" fill="url(#scCape)" />
            <path
              d="M18 10c6-6 22-6 28 0 4 4 5 12 1 19-3 5-3 14-8 18-2 2-4 0-5-2-1-2-4-2-5 0-1 2-3 4-5 2-5-4-5-13-8-18-4-7-3-15 2-19z"
              fill="#FFFDF9" stroke="#E5E7EB" strokeWidth="1.2"
            />
            <circle cx="26" cy="26" r="2.2" fill="#0F172A" />
            <circle cx="38" cy="26" r="2.2" fill="#0F172A" />
            <path d="M30 33c2 2 6 2 8 0" fill="none" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="22.5" cy="30" r="2.3" fill="#FF98AE" />
            <circle cx="41.5" cy="30" r="2.3" fill="#FF98AE" />
          </svg>
          <span className="text-sm font-extrabold tracking-tight">{brand}</span>
        </div>

        {/* Right addon (e.g. bell) */}
        {rightAddon}
      </div>
    </div>
  )
}
