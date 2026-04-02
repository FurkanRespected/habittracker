import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AddHabit from '../components/AddHabit.jsx'
import { ExecutionHeatmapCard, ProtocolCompletionCard } from '../components/DashboardSidebar.jsx'
import HabitList from '../components/HabitList.jsx'

function formatCycleDate() {
  const d = new Date()
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }).toUpperCase()
}

export default function ProtocolsPage({
  habits,
  hasHabits,
  emptyHint,
  onAddHabit,
  onToggleDay,
  onDeleteHabit,
  onRenameHabit,
  loading,
  error,
}) {
  const location = useLocation()

  useEffect(() => {
    if (location.hash !== '#protocol-add') return
    const t = window.setTimeout(() => {
      document.getElementById('protocol-add')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => window.clearTimeout(t)
  }, [location.hash, location.pathname])

  return (
    <div className="dashPage">
      {error ? <div className="authError dashBanner">{error}</div> : null}

      <div className="dashSplit">
        <div className="dashMainCol">
          <div className="dashSectionHead">
            <div>
              <h3 className="dashSectionTitle">Tüm protokoller</h3>
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
