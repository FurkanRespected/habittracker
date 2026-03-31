import { NavLink } from 'react-router-dom'

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `shellNavItem ${isActive ? 'isActive' : ''}`
      }
      end={to === '/'}
    >
      <span className="shellNavIcon" aria-hidden="true">
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
  onLogActivity,
  children,
}) {
  return (
    <div className="shell">
      <aside className="shellAside">
        <div className="shellBrand">
          <h1 className="shellLogo">DISCIPLINE</h1>
          <p className="shellStreakLabel">Seri: {streakDays} gün</p>
        </div>
        <nav className="shellNav">
          <NavItem to="/" icon="▦" label="Dashboard" />
          <NavItem to="/insights" icon="▤" label="Insights" />
          <NavItem to="/community" icon="◎" label="Community" />
          <NavItem to="/training" icon="◇" label="Training" />
        </nav>
        <div className="shellAsideFooter">
          <button type="button" className="shellCta" onClick={onLogActivity}>
            + Protokol ekle
          </button>
          <div className="shellFooterLinks">
            {onSignOut ? (
              <button type="button" className="shellFooterBtn" onClick={onSignOut}>
                Çıkış
              </button>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="shellMain">
        <header className="shellHeader">
          <div className="shellHeaderTitle">
            <span className="shellMonolith">MONOLITH</span>
          </div>
          <div className="shellHeaderRight">
            <span className="shellUserName">{userLabel}</span>
            <div className="shellAvatar" aria-hidden="true">
              {(userLabel || '?').slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="shellContent">{children}</div>
      </div>
    </div>
  )
}
