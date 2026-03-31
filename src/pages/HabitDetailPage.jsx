import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { addDays, getLastNDays, toDateKey } from '../utils/dateUtils.js'

function calcRate(history, daysBack) {
  const today = new Date()
  let done = 0
  for (let i = 0; i < daysBack; i++) {
    const key = toDateKey(addDays(today, -i))
    if (history?.[key]) done++
  }
  return { done, total: daysBack, pct: daysBack ? Math.round((done / daysBack) * 100) : 0 }
}

export default function HabitDetailPage({ habits, onToggleDay }) {
  const { id } = useParams()
  const habit = habits.find((h) => h.id === id)
  const [weekShift, setWeekShift] = useState(0)
  const todayKey = toDateKey(new Date())

  const days = useMemo(() => {
    const endDate = addDays(new Date(), -weekShift)
    return getLastNDays(90, endDate)
  }, [weekShift])

  const stats = useMemo(() => {
    const history = habit?.history || {}
    return {
      last30: calcRate(history, 30),
      last90: calcRate(history, 90),
    }
  }, [habit?.history])

  if (!habit) {
    return (
      <div className="dashDetailPage">
        <div className="dashEmpty">
          Alışkanlık bulunamadı. <Link className="textButton" to="/">Geri dön</Link>
        </div>
      </div>
    )
  }

  const canGoForward = weekShift > 0

  return (
    <div className="dashDetailPage">
      <header className="dashDetailHead">
        <div className="dashDetailTop">
          <Link className="textButton" to="/">
            ← Geri
          </Link>
          <div className="detailActions">
            <button
              className="iconButton iconOnly"
              type="button"
              onClick={() => setWeekShift((v) => v + 7)}
              aria-label="1 hafta geri"
              title="1 hafta geri"
            >
              <span className="chevron" aria-hidden="true">
                ‹
              </span>
            </button>
            <button
              className="iconButton iconOnly"
              type="button"
              onClick={() => setWeekShift((v) => Math.max(0, v - 7))}
              disabled={!canGoForward}
              aria-label="1 hafta ileri"
              title="1 hafta ileri"
            >
              <span className="chevron" aria-hidden="true">
                ›
              </span>
            </button>
          </div>
        </div>
        <h1 className="dashDetailTitle">{habit.name}</h1>
        <p className="dashDetailSub">
          Son 30 gün: <b>%{stats.last30.pct}</b> ({stats.last30.done}/{stats.last30.total}) · Son 90
          gün: <b>%{stats.last90.pct}</b> ({stats.last90.done}/{stats.last90.total})
        </p>
      </header>

      <section className="dashDetailCard">
        <div className="daysGrid daysGrid90" role="group" aria-label="90 günlük görünüm">
          {days.map((d) => {
            const checked = Boolean(habit.history?.[d.key])
            const isToday = d.key === todayKey
            return (
              <label
                key={d.key}
                className={`dayCell ${checked ? 'isChecked' : ''} ${isToday ? 'isToday' : ''}`}
                title={d.key}
              >
                <span className="dayDow">{d.date.getDate()}</span>
                <input
                  className="dayInput"
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleDay(habit.id, d.key, !checked)}
                />
              </label>
            )
          })}
        </div>
      </section>
    </div>
  )
}
