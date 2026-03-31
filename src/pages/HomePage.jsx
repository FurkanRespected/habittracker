import AddHabit from '../components/AddHabit.jsx'
import HabitList from '../components/HabitList.jsx'

export default function HomePage({
  subtitle,
  topBar,
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
  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <h1 className="title">Habit Tracker</h1>
          <p className="subtitle">{subtitle}</p>
        </header>

        <section className="card">
          {topBar}
          {error ? <div className="authError">{error}</div> : null}

          <AddHabit onAdd={onAddHabit} />

          {loading ? (
            <div className="empty">Veriler yükleniyor...</div>
          ) : hasHabits ? (
            <HabitList
              habits={habits}
              onToggleDay={onToggleDay}
              onDeleteHabit={onDeleteHabit}
              onRenameHabit={onRenameHabit}
            />
          ) : (
            <div className="empty">
              Henüz alışkanlık yok.
              <span className="muted"> {emptyHint}</span>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

