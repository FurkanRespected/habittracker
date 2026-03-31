import AddHabit from '../components/AddHabit.jsx'
import { ExecutionHeatmapCard, ProtocolCompletionCard } from '../components/DashboardSidebar.jsx'
import HabitList from '../components/HabitList.jsx'

function formatCycleDate() {
  const d = new Date()
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }).toUpperCase()
}

export default function HomePage({
  habits,
  hasHabits,
  emptyHint,
  onAddHabit,
  onToggleDay,
  onDeleteHabit,
  onRenameHabit,
  loading,
  error,
  maxStreakDays = 0,
}) {
  return (
    <div className="dashPage">
      {error ? <div className="authError dashBanner">{error}</div> : null}

      <section className="dashHeroGrid">
        <div className="dashHeroCard">
          <span className="dashKicker">Kritik odak</span>
          <h2 className="dashHeroTitle">Derin çalışma bloğu</h2>
          <p className="dashHeroBody">
            90 dakikalık bilişsel izolasyon ayır. Dikkat dağıtıcı yok. Ana hedefi tamamla.
          </p>
          <div className="dashHeroActions">
            <button type="button" className="dashBtnPrimary">
              Zamanlayıcı
            </button>
            <button type="button" className="dashBtnGhost">
              Yeniden ayarla
            </button>
          </div>
        </div>
        <div className="dashStreakCard">
          <div className="dashStreakTop">
            <span className="dashStreakBolt" aria-hidden="true">
              ⚡
            </span>
            <span className="dashStreakNumber">{maxStreakDays}</span>
          </div>
          <h3 className="dashStreakHeading">EN UZUN SERİ (GÜN)</h3>
          <p className="dashStreakSub">
            {hasHabits ? 'Bugünkü görevlerini işaretle.' : 'İlk protokolünü ekle.'}
          </p>
        </div>
      </section>

      <div className="dashSplit">
        <div className="dashMainCol">
          <div className="dashSectionHead">
            <div>
              <h3 className="dashSectionTitle">Günlük protokoller</h3>
              <p className="dashSectionMeta">
                {formatCycleDate()} // döngü
              </p>
            </div>
          </div>

          <div id="protocol-add" className="dashAddBlock">
            <AddHabit onAdd={onAddHabit} />
          </div>

          {loading ? (
            <div className="dashEmpty">Veriler yükleniyor...</div>
          ) : hasHabits ? (
            <HabitList
              habits={habits}
              onToggleDay={onToggleDay}
              onDeleteHabit={onDeleteHabit}
              onRenameHabit={onRenameHabit}
            />
          ) : (
            <div className="dashEmpty">
              Henüz protokol yok.
              <span className="dashMuted"> {emptyHint}</span>
            </div>
          )}
        </div>

        <aside className="dashSideCol">
          <ProtocolCompletionCard habits={habits} />
          <ExecutionHeatmapCard habits={habits} />
        </aside>
      </div>
    </div>
  )
}
