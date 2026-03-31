import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addDays,
  fromDateKey,
  getLastNDays,
  getTrWeekdayShort,
  toDateKey,
} from '../utils/dateUtils.js'

function getCurrentStreak(history) {
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 3650; i++) {
    const key = toDateKey(addDays(today, -i))
    if (!history?.[key]) break
    streak++
  }
  return streak
}

function getBestStreak(history) {
  const keys = Object.keys(history || {}).filter((k) => history[k])
  if (keys.length === 0) return 0

  keys.sort()
  const start = fromDateKey(keys[0])
  const end = new Date()

  let best = 0
  let run = 0

  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const key = toDateKey(d)
    if (history?.[key]) {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
  }

  return best
}

export default function HabitItem({
  habit,
  onToggleDay,
  onDeleteHabit,
  onRenameHabit,
}) {
  const todayKey = toDateKey(new Date())
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(habit.name)
  const [weekShift, setWeekShift] = useState(0) // 0 => ends today, +7 => 1 week back, etc.

  const stats = useMemo(() => {
    const history = habit.history || {}
    return {
      currentStreak: getCurrentStreak(history),
      bestStreak: getBestStreak(history),
    }
  }, [habit.history])

  const days = useMemo(() => {
    const endDate = addDays(new Date(), -weekShift)
    return getLastNDays(14, endDate)
  }, [weekShift])
  const streakStrength = Math.max(0, Math.min(1, stats.currentStreak / 14))
  const streakStyle = useMemo(() => {
    // 0..1 => subtle..strong
    const bg = 0.12 + streakStrength * 0.18
    const border = 0.34 + streakStrength * 0.28
    const glow = 0.06 + streakStrength * 0.12
    return {
      '--streak-bg': bg.toFixed(3),
      '--streak-border': border.toFixed(3),
      '--streak-glow': glow.toFixed(3),
    }
  }, [streakStrength])

  function requestDelete() {
    const ok = window.confirm(`"${habit.name}" silinsin mi?`)
    if (!ok) return
    onDeleteHabit(habit.id)
  }

  function startEdit() {
    setDraftName(habit.name)
    setIsEditing(true)
  }

  function cancelEdit() {
    setDraftName(habit.name)
    setIsEditing(false)
  }

  function saveEdit(e) {
    e.preventDefault()
    onRenameHabit(habit.id, draftName)
    setIsEditing(false)
  }

  const canGoForward = weekShift > 0

  return (
    <article className="habitCard">
      <div className="habitTop">
        {isEditing ? (
          <form className="habitEdit" onSubmit={saveEdit}>
            <input
              className="habitEditInput"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              autoFocus
            />
            <button className="iconButton" type="submit" disabled={!draftName.trim()}>
              Kaydet
            </button>
            <button className="iconButton" type="button" onClick={cancelEdit}>
              İptal
            </button>
          </form>
        ) : (
          <>
            <div className="habitTitleRow">
              <h3 className="habitName">
                <Link className="habitLink" to={`/habit/${habit.id}`}>
                  {habit.name}
                </Link>
              </h3>
              <span className="streakBadge" title="Güncel seri" style={streakStyle}>
                <span className="streakIcon" aria-hidden="true">
                  🔥
                </span>
                <span className="streakValue">{stats.currentStreak}</span>
              </span>
            </div>
            <div className="habitActions">
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
              <button className="iconButton" type="button" onClick={startEdit}>
                Düzenle
              </button>
              <button
                className="iconButton danger"
                type="button"
                onClick={requestDelete}
              >
                Sil
              </button>
            </div>
          </>
        )}
      </div>

      <div className="daysGrid" role="group" aria-label="14 günlük görünüm">
        {days.map((d) => {
          const checked = Boolean(habit.history?.[d.key])
          const isToday = d.key === todayKey
          return (
            <label
              key={d.key}
              className={`dayCell ${checked ? 'isChecked' : ''} ${
                isToday ? 'isToday' : ''
              }`}
              title={d.key}
            >
              <span className="dayDow">{getTrWeekdayShort(d.date)}</span>
              <span className="dayDom">{d.date.getDate()}</span>
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
    </article>
  )
}
