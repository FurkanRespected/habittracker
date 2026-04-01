import { useNavigate } from 'react-router-dom'
import AddHabit from '../components/AddHabit.jsx'
import { ExecutionHeatmapCard, ProtocolCompletionCard } from '../components/DashboardSidebar.jsx'
import HabitList from '../components/HabitList.jsx'
import { todayCompletionStats } from '../utils/dashboardUtils.js'
import { toDateKey } from '../utils/dateUtils.js'

const FOCUS_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBBA174Qis_JT2iVKGvxxId1H9-T1A7Sb6L30fd8zEHGiXGaTp3wMk5z12MIbyW9V9fTFVS7y2E8T0GC3mtkOhJ-jmmwscsp8VNog1kRhphN_n1mj-vQcTnT1HOmkSNSKy3jHzjmzPaI5zzxjBBdoRb1YVhgHKqP9ectAtQnG8LofjYXtUERbTPgvVq3SW0NzVB_YKmzhMLd-c-NGDCslyuNuV41937vrhdmUuPLme25dfT7C-vU_8gNhdF9FB29M-KSJMGLhcANcPK'

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
  const navigate = useNavigate()
  const todayKey = toDateKey(new Date())
  const { pct: momentumPct } = todayCompletionStats(habits, todayKey)
  const tierNote =
    momentumPct >= 85 ? 'Üst %5 performans katmanı.' : 'Her işaret bir ilerleme.'

  return (
    <div className="dashPage">
      {error ? <div className="authError dashBanner">{error}</div> : null}

      <section className="dashHeroGrid">
        <div className="dashHeroCard">
          <div className="dashHeroInner">
            <span className="dashKicker">Kritik odak</span>
            <h2 className="dashHeroTitle">Derin çalışma oturumu</h2>
            <p className="dashHeroBody">
              90 dakikalık bilişsel izolasyon ayır. Dikkat dağıtıcı yok. Ana hedefi tamamla.
            </p>
            <div className="dashHeroActions">
              <button type="button" className="dashBtnPrimary">
                Zamanlayıcıyı başlat
              </button>
              <button type="button" className="dashBtnGhost">
                Yeniden kalibre et
              </button>
            </div>
          </div>
          <div className="dashHeroVisual">
            <img src={FOCUS_IMG} alt="" loading="lazy" />
            <div className="dashHeroSkew" />
          </div>
        </div>
        <div className="dashStreakCard">
          <div>
            <div className="dashStreakTop">
              <span className="material-symbols-outlined dashStreakBoltIco" aria-hidden="true">
                bolt
              </span>
              <span className="dashStreakNumber">{maxStreakDays}</span>
            </div>
            <h3 className="dashStreakHeading">Günlük seri</h3>
            <p className="dashStreakSub">{tierNote}</p>
          </div>
          <div className="dashStreakMomentum">
            <div className="dashMomRow">
              <span>Momentum endeksi</span>
              <span>{momentumPct}%</span>
            </div>
            <div className="dashMomBar">
              <div className="dashMomFill" style={{ width: `${momentumPct}%` }} />
            </div>
          </div>
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
            <button type="button" className="dashSectionExpand">
              Tümünü aç{' '}
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
                trending_flat
              </span>
            </button>
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

      <button
        type="button"
        className="dashFab"
        aria-label="Yeni protokol"
        onClick={() => navigate('/mission')}
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  )
}
