import { NavLink } from 'react-router-dom'

export default function ProfilePage({
  userLabel,
  sessionEmail,
  hasCloud,
  habitCount,
  streakDays,
}) {
  return (
    <div className="profPage">
      <header className="profHead">
        <p className="profKicker">KİMLİK</p>
        <h1 className="profTitle">Profil</h1>
        <p className="profSub">
          {hasCloud
            ? 'Hesap özeti ve hızlı erişim. Rozetler ve geçmiş grafikler ileride burada olabilir.'
            : 'Yerel kayıt kullanıyorsun. Senkron için Supabase `.env` ayarla.'}
        </p>
      </header>

      <section className="profCard">
        <h2 className="profCardTitle">Özet</h2>
        <div className="profStatGrid">
          <div className="profStatTile">
            <p className="profStatTileK">Aktif protokol</p>
            <p className="profStatTileV">{habitCount}</p>
          </div>
          <div className="profStatTile">
            <p className="profStatTileK">En uzun seri</p>
            <p className="profStatTileV">
              {streakDays}
              <span className="profStatTileSuf">gün</span>
            </p>
          </div>
        </div>
      </section>

      <section className="profCard">
        <h2 className="profCardTitle">Hesap</h2>
        <dl className="profDl">
          <dt>E-posta / etiket</dt>
          <dd>{sessionEmail || userLabel}</dd>
        </dl>
        <p className="profMuted" style={{ marginTop: '1rem' }}>
          <NavLink to="/settings" className="textButton">
            Ayarlara git →
          </NavLink>
        </p>
      </section>

      <section className="profCard">
        <h2 className="profCardTitle">Kısayollar</h2>
        <div className="profQuickGrid">
          <NavLink to="/protocols" className="profQuickLink">
            <span className="material-symbols-outlined" aria-hidden="true">
              checklist
            </span>
            Protokoller
          </NavLink>
          <NavLink to="/training" className="profQuickLink">
            <span className="material-symbols-outlined" aria-hidden="true">
              fitness_center
            </span>
            Antrenman
          </NavLink>
          <NavLink to="/panel" className="profQuickLink">
            <span className="material-symbols-outlined" aria-hidden="true">
              grid_view
            </span>
            Panel
          </NavLink>
          <NavLink to="/community" className="profQuickLink">
            <span className="material-symbols-outlined" aria-hidden="true">
              groups
            </span>
            Topluluk
          </NavLink>
          <NavLink to="/tasks" className="profQuickLink">
            <span className="material-symbols-outlined" aria-hidden="true">
              task_alt
            </span>
            Görevler
          </NavLink>
          <NavLink to="/focus" className="profQuickLink">
            <span className="material-symbols-outlined" aria-hidden="true">
              timer
            </span>
            Odak
          </NavLink>
        </div>
      </section>
    </div>
  )
}
