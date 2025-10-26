// src/components/Admin/AdminLayout.jsx
import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  Users, History, Clock4, FileChartLine, KeyRound, LogOut, X, MessageSquareMore
} from 'lucide-react'
import AppHeader from '../AppHeader'

// 🔔 chat notifications (badge + toast + bell)
import useChatNotifications from '../../hooks/useChatNotifications'
import ChatToast from '../chat/ChatToast'
import ChatBell from '../chat/ChatBell'

export default function AdminLayout() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'Admin'
  const [mobileOpen, setMobileOpen] = useState(false)

  // 🔔 unread + toast
  const { unread, clearUnread, toast, setToast, openChat } = useChatNotifications()

  useEffect(() => {
    const close = () => setMobileOpen(false)
    window.addEventListener('hashchange', close)
    return () => window.removeEventListener('hashchange', close)
  }, [])

  const handleLogout = () => {
    logoutUser()
    navigate('/')
  }

  const linkBase =
    'group flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-semibold outline-none transition ' +
    'focus-visible:ring-2 focus-visible:ring-emerald-300'
  const linkIdle = 'text-slate-700 hover:bg-slate-100 active:scale-[0.99]'
  const linkActive = 'text-white bg-gradient-to-r from-emerald-500 to-cyan-500 shadow'

  const iconWrap =
    'relative inline-flex h-8 w-8 items-center justify-center rounded-lg ' +
    'bg-slate-100 text-slate-700 ring-1 ring-slate-200 ' +
    'group-hover:rotate-1 group-active:scale-95 transition'
  const iconWrapActive = 'bg-white/20 text-white ring-0'

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(16,185,129,0.18),transparent),radial-gradient(1000px_600px_at_90%_10%,rgba(59,130,246,0.18),transparent)]">
      <AppHeader
        title="Admin Panel"
        brand="Smile Castle"
        onMenu={() => setMobileOpen(true)}
        rightAddon={<ChatBell unread={unread} onClick={clearUnread} />}
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 lg:grid-cols-[300px_1fr]">
        {/* Mobile drawer */}
        {mobileOpen && (
          <Drawer onClose={() => setMobileOpen(false)} id="app-drawer">
            <DrawerHeader onClose={() => setMobileOpen(false)} />
            <DrawerNav>
              <DrawerBrand />

              <nav className="flex flex-col gap-1" role="navigation">
                {/* NEW: Chat link (top-level route) */}
                <MobileLink
                  to="/chat"
                  onSelect={() => {
                    clearUnread()
                    setMobileOpen(false)
                  }}
                >
                  <>
                    <span className={`${iconWrap}`}>
                      <MessageSquareMore size={16} aria-hidden />
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-[5px] text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </span>
                    <span>Chat</span>
                  </>
                </MobileLink>

                <MobileLink to="/admin/employees" onSelect={() => setMobileOpen(false)}>
                  <>
                    <span className={`${iconWrap}`}><Users size={16} aria-hidden /></span>
                    <span>Employee Management</span>
                  </>
                </MobileLink>

                <MobileLink to="/admin/punch-history" onSelect={() => setMobileOpen(false)}>
                  <>
                    <span className={`${iconWrap}`}><History size={16} aria-hidden /></span>
                    <span>Punch History</span>
                  </>
                </MobileLink>

                <MobileLink to="/admin/punch-requests" onSelect={() => setMobileOpen(false)}>
                  <>
                    <span className={`${iconWrap}`}><Clock4 size={16} aria-hidden /></span>
                    <span>Punch Requests</span>
                  </>
                </MobileLink>

                <MobileLink to="/admin/reports" onSelect={() => setMobileOpen(false)}>
                  <>
                    <span className={`${iconWrap}`}><FileChartLine size={16} aria-hidden /></span>
                    <span>Reports</span>
                  </>
                </MobileLink>

                {isAdmin && (
                  <MobileLink to="/admin/password-requests" onSelect={() => setMobileOpen(false)}>
                    <>
                      <span className={`${iconWrap}`}><KeyRound size={16} aria-hidden /></span>
                      <span>Password Requests</span>
                    </>
                  </MobileLink>
                )}
              </nav>

              <div className="mt-6 px-3">
                <button
                  onClick={() => { setMobileOpen(false); handleLogout() }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-2 text-[15px] font-semibold text-white shadow-md transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                  <LogOut size={16} aria-hidden /> Logout
                </button>
              </div>
            </DrawerNav>
          </Drawer>
        )}

        {/* Desktop / tablet sidebar */}
        <aside
          className="sticky top-0 z-30 hidden h-screen flex-col justify-between border-r border-slate-200 bg-white/95 px-5 py-6 text-slate-900 shadow-lg lg:flex"
          aria-label="Admin navigation"
        >
          <div>
            <div className="mb-6 flex items-center gap-3 px-1">
              <InlineLogo className="h-11 w-11 rounded-2xl" />
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">Smile Castle</h1>
                <p className="text-xs text-slate-500">Admin Panel</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1" role="navigation">
              {/* NEW: Chat link with unread badge */}
              <DesktopLink
                to="/chat"
                onSelect={clearUnread}
                badgeCount={unread}
                linkBase={linkBase}
                linkIdle={linkIdle}
                linkActive={linkActive}
                iconWrap={iconWrap}
                iconWrapActive={iconWrapActive}
              >
                <MessageSquareMore size={16} aria-hidden />
                <span>Chat</span>
              </DesktopLink>

              <DesktopLink to="/admin/employees" linkBase={linkBase} linkIdle={linkIdle} linkActive={linkActive} iconWrap={iconWrap} iconWrapActive={iconWrapActive}>
                <Users size={16} aria-hidden />
                <span>Employee Management</span>
              </DesktopLink>

              <DesktopLink to="/admin/punch-history" linkBase={linkBase} linkIdle={linkIdle} linkActive={linkActive} iconWrap={iconWrap} iconWrapActive={iconWrapActive}>
                <History size={16} aria-hidden />
                <span>Punch History</span>
              </DesktopLink>

              <DesktopLink to="/admin/punch-requests" linkBase={linkBase} linkIdle={linkIdle} linkActive={linkActive} iconWrap={iconWrap} iconWrapActive={iconWrapActive}>
                <Clock4 size={16} aria-hidden />
                <span>Punch Requests</span>
              </DesktopLink>

              <DesktopLink to="/admin/reports" linkBase={linkBase} linkIdle={linkIdle} linkActive={linkActive} iconWrap={iconWrap} iconWrapActive={iconWrapActive}>
                <FileChartLine size={16} aria-hidden />
                <span>Reports</span>
              </DesktopLink>

              {isAdmin && (
                <DesktopLink to="/admin/password-requests" linkBase={linkBase} linkIdle={linkIdle} linkActive={linkActive} iconWrap={iconWrap} iconWrapActive={iconWrapActive}>
                  <KeyRound size={16} aria-hidden />
                  <span>Password Requests</span>
                </DesktopLink>
              )}
            </nav>
          </div>

          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-2 text-[15px] font-semibold text-white shadow-md transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
              aria-label="Logout"
            >
              <LogOut size={16} aria-hidden /> Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="relative px-4 py-6 lg:px-8">
          <div
            className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <span className="font-semibold">Welcome to Smile Castle</span>
            {user?.name ? `, ${user.name}.` : '.'}
          </div>
          <div className="grid grid-cols-1 gap-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 🔔 Chat toast (global for Admin layout) */}
      <ChatToast toast={toast} onOpen={openChat} onClose={() => setToast(null)} />
    </div>
  )
}

/* ───────── sub-components ───────── */

function DesktopLink({
  to,
  children,
  linkBase,
  linkIdle,
  linkActive,
  iconWrap,
  iconWrapActive,
  onSelect,
  badgeCount = 0,
}) {
  return (
    <NavLink
      to={to}
      onClick={onSelect}
      className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
    >
      {({ isActive }) => (
        <>
          <span className={`${iconWrap} ${isActive ? iconWrapActive : ''}`}>
            {children[0]}
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-[5px] text-[10px] font-bold text-white">
                {badgeCount}
              </span>
            )}
          </span>
          <span className="truncate">{children[1]}</span>
        </>
      )}
    </NavLink>
  )
}

/** Inline, asset-free logo to avoid 404s */
function InlineLogo({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="Smile Castle mark" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scCape2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34D399" />
          <stop offset="1" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      <path d="M8 36c10-6 20-6 32-2 8 2 12 2 16-1v8c-6 3-12 3-18 2-12-2-20 1-30 6z" fill="url(#scCape2)" />
      <path d="M18 10c6-6 22-6 28 0 4 4 5 12 1 19-3 5-3 14-8 18-2 2-4 0-5-2-1-2-4-2-5 0-1 2-3 4-5 2-5-4-5-13-8-18-4-7-3-15 2-19z"
        fill="#FFF8F0" stroke="#E5E7EB" strokeWidth="1.2" />
      <circle cx="26" cy="26" r="2.2" fill="#0F172A" />
      <circle cx="38" cy="26" r="2.2" fill="#0F172A" />
      <path d="M30 33c2 2 6 2 8 0" fill="none" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="22.5" cy="30" r="2.3" fill="#FF9EB5" />
      <circle cx="41.5" cy="30" r="2.3" fill="#FF9EB5" />
    </svg>
  )
}

/* Drawer with slide-in open animation */
function Drawer({ children, onClose, id }) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const rAF = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(rAF)
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const backdropRef = useRef(null)
  const onBackdrop = (e) => {
    if (e.target === backdropRef.current) onClose()
  }

  return (
    <div
      ref={backdropRef}
      onMouseDown={onBackdrop}
      className={`fixed inset-0 z-50 grid grid-cols-[minmax(0,1fr)] lg:hidden transition-colors duration-300 ${entered ? 'bg-black/40' : 'bg-black/0'}`}
      role="dialog"
      aria-modal="true"
      id={id}
    >
      <div
        className={`h-full w-[86%] max-w-xs bg-white shadow-2xl will-change-transform transform transition-transform duration-300 ease-out ${entered ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {children}
      </div>
      <div />
    </div>
  )
}

function DrawerHeader({ onClose }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
      <div className="flex items-center gap-2">
        <InlineLogo className="h-8 w-8 rounded-xl" />
        <div className="text-sm font-bold tracking-tight">Smile Castle</div>
      </div>
      <button
        onClick={onClose}
        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        aria-label="Close menu"
      >
        <X size={18} aria-hidden />
      </button>
    </div>
  )
}

function DrawerBrand() {
  return (
    <div className="px-4 py-4">
      <div className="text-xs text-slate-500">Admin Panel</div>
      <h2 className="text-lg font-extrabold leading-tight">Navigation</h2>
    </div>
  )
}

function DrawerNav({ children }) {
  return <div className="flex h-[calc(100%-0px)] flex-col overflow-y-auto">{children}</div>
}

function MobileLink({ to, onSelect, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        'mx-3 mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold ' +
        (isActive
          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow'
          : 'text-slate-700 hover:bg-slate-100')
      }
      onClick={onSelect}
    >
      {children}
    </NavLink>
  )
}
