import { NavLink, useLocation } from 'react-router-dom'

const CRUMB = {
  '/insights': 'INSIGHTS',
  '/community': 'COMMUNITY',
  '/training': 'TRAINING',
  '/mission': 'GÖREV',
}

const USER_TAG = {
  '/insights': 'Elit katman',
  '/community': 'Elit komutan',
  '/training': 'Elit komutan',
  '/mission': 'Operatör',
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => `shellNavItem ${isActive ? 'isActive' : ''}`}
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
  onLogActivity,
  children,
}) {
  const { pathname } = useLocation()
  const crumb = CRUMB[pathname] || null
  const userTag = USER_TAG[pathname] || null
  const showShield = pathname !== '/' && pathname !== '/mission'

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
        <nav className="shellNav">
          <NavItem to="/" icon="grid_view" label="Dashboard" />
          <NavItem to="/insights" icon="analytics" label="Insights" />
          <NavItem to="/community" icon="groups" label="Community" />
          <NavItem to="/training" icon="fitness_center" label="Training" />
        </nav>
        <div className="shellAsideFooter">
          <button type="button" className="shellCta" onClick={onLogActivity}>
            <span className="material-symbols-outlined shellCtaIco" aria-hidden="true">
              add
            </span>
            <span>Log Activity</span>
          </button>
          <div className="shellFooterLinks">
            <button type="button" className="shellFooterBtn shellFooterBtnWithIco">
              <span className="material-symbols-outlined">settings</span>
              Ayarlar
            </button>
            {onSignOut ? (
              <button type="button" className="shellFooterBtn shellFooterBtnWithIco" onClick={onSignOut}>
                <span className="material-symbols-outlined">logout</span>
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
            <div className="shellUserBlock">
              <div className="shellUserText">
                <span className="shellUserName">{userLabel}</span>
                {userTag ? <span className="shellUserTag">{userTag}</span> : null}
              </div>
              <div className="shellAvatar" aria-hidden="true">
                {(userLabel || '?').slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <div className="shellContent">{children}</div>
      </div>
    </div>
  )
}
