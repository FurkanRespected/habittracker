import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const CRUMB = {
  '/panel': 'PANEL',
  '/protocols': 'PROTOKOLLER',
  '/community': 'TOPLULUK',
  '/training': 'ANTRENMAN',
  '/tasks': 'GÖREVLER',
  '/focus': 'ODAK',
  '/profile': 'PROFİL',
  '/settings': 'AYARLAR',
}

const USER_TAG = {
  '/panel': 'Elit komutan',
  '/protocols': 'Elit komutan',
  '/community': 'Elit komutan',
  '/training': 'Elit komutan',
  '/tasks': 'Elit komutan',
  '/focus': 'Elit komutan',
  '/profile': 'Hesap',
  '/settings': 'Hesap',
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/panel'}
      className={({ isActive }) => `shellNavItem${isActive ? ' isActive' : ''}`}
    >
      <span className="material-symbols-outlined shellNavIcon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </NavLink>
  )
}

export default function AppShell({
  streakDays,
  userLabel,
  onSignOut,
  children,
}) {
  const { pathname } = useLocation()
  const crumb =
    pathname.startsWith('/training') ? 'ANTRENMAN' : CRUMB[pathname] || null
  const userTag =
    pathname.startsWith('/training') ? 'Elit komutan' : USER_TAG[pathname] || null
  const showShield = pathname !== '/panel'
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    setProfileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!profileMenuOpen) return
    function onDoc(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false)
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setProfileMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [profileMenuOpen])

  return (
    <div className="shell">
      <aside className="shellAside">
        <div className="shellBrand">
          <div className="shellBrandRow">
            {showShield ? (
              <span className="shellBrandShield" aria-hidden="true">
                <span className="material-symbols-outlined">shield</span>
              </span>
            ) : null}
            <h1 className="shellLogo">DISCIPLINE</h1>
          </div>
          <p className="shellStreakLabel">Seri: {streakDays} gün</p>
        </div>
        <nav className="shellNav" aria-label="Ana menü">
          <NavItem to="/panel" icon="grid_view" label="Panel" />
          <NavItem to="/protocols" icon="checklist" label="Protokoller" />
          <NavItem to="/tasks" icon="task_alt" label="Görevler" />
          <NavItem to="/focus" icon="timer" label="Odak" />
          <NavItem to="/community" icon="groups" label="Topluluk" />
          <NavItem to="/training" icon="fitness_center" label="Antrenman" />
        </nav>
      </aside>

      <main className="shellMain">
        <header className="shellHeader">
          <div className="shellHeaderTitle">
            <span className="shellMonolith">MONOLITH</span>
            {crumb ? (
              <>
                <span className="shellHeaderRule" aria-hidden="true" />
                <span className="shellHeaderCrumb">{crumb}</span>
              </>
            ) : null}
          </div>
          <div className="shellHeaderRight">
            <button type="button" className="shellIconBtn" aria-label="Bildirimler">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="shellProfileWrap" ref={profileMenuRef}>
              <button
                type="button"
                className="shellProfileTrigger"
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                aria-label="Profil menüsü"
                onClick={() => setProfileMenuOpen((o) => !o)}
              >
                <div className="shellUserText">
                  <span className="shellUserName">{userLabel}</span>
                  {userTag ? <span className="shellUserTag">{userTag}</span> : null}
                </div>
                <div className="shellAvatar" aria-hidden="true">
                  {(userLabel || '?').slice(0, 1).toUpperCase()}
                </div>
              </button>
              {profileMenuOpen ? (
                <div className="shellProfileMenu" role="menu">
                  <NavLink
                    to="/profile"
                    role="menuitem"
                    className="shellProfileMenuItem"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <span className="material-symbols-outlined shellProfileMenuIco" aria-hidden="true">
                      person
                    </span>
                    Profil
                  </NavLink>
                  <NavLink
                    to="/settings"
                    role="menuitem"
                    className="shellProfileMenuItem"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <span className="material-symbols-outlined shellProfileMenuIco" aria-hidden="true">
                      settings
                    </span>
                    Ayarlar
                  </NavLink>
                  {onSignOut ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="shellProfileMenuItem shellProfileMenuDanger"
                      onClick={() => {
                        setProfileMenuOpen(false)
                        onSignOut()
                      }}
                    >
                      <span className="material-symbols-outlined shellProfileMenuIco" aria-hidden="true">
                        logout
                      </span>
                      Çıkış
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <div className="shellContent">{children}</div>
      </main>
    </div>
  )
}
