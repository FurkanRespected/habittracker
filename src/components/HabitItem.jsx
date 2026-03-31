import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { protocolIconLetter } from '../utils/dashboardUtils.js'
import { addDays, getLastNDays, getTrWeekdayShort, toDateKey } from '../utils/dateUtils.js'

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

export default function HabitItem({
  habit,
  onToggleDay,
  onDeleteHabit,
  onRenameHabit,
}) {
  const todayKey = toDateKey(new Date())
  const todayDone = Boolean(habit.history?.[todayKey])
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(habit.name)
  const [weekShift, setWeekShift] = useState(0)

  const stats = useMemo(() => {
    const history = habit.history || {}
    return { currentStreak: getCurrentStreak(history) }
  }, [habit.history])

  const days = useMemo(() => {
    const endDate = addDays(new Date(), -weekShift)
    return getLastNDays(14, endDate)
  }, [weekShift])

  const streakStrength = Math.max(0, Math.min(1, stats.currentStreak / 14))
  const streakStyle = useMemo(() => {
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
  const letter = protocolIconLetter(habit.name)

  return (
    <article className={`protocolCard ${todayDone ? 'protocolCardDone' : ''}`}>
      {isEditing ? (
        <form className="protocolEdit" onSubmit={saveEdit}>
          <input
            className="protocolEditInput"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            autoFocus
          />
          <button className="protocolMiniBtn" type="submit" disabled={!draftName.trim()}>
            Kaydet
          </button>
          <button className="protocolMiniBtn" type="button" onClick={cancelEdit}>
            İptal
          </button>
        </form>
      ) : (
        <>
          <div className="protocolRow">
            <div className="protocolIcon" aria-hidden="true">
              {letter}
            </div>
            <div className="protocolInfo">
              <Link className="protocolTitle" to={`/habit/${habit.id}`}>
                {habit.name}
              </Link>
              <p className="protocolMeta">Seri · {stats.currentStreak} gün</p>
            </div>
            <div className="protocolConsistency">
              <span className="protocolConsLabel">Tutarlılık</span>
              <span className="protocolConsVal">{stats.currentStreak} gün</span>
            </div>
            <div className="protocolBadges">
              <span className="protocolStreakPill" style={streakStyle} title="Güncel seri">
                <span aria-hidden="true">🔥</span>
                <span>{stats.currentStreak}</span>
              </span>
            </div>
            <button
              type="button"
              className={`protocolCheck ${todayDone ? 'isChecked' : ''}`}
              onClick={() => onToggleDay(habit.id, todayKey, !todayDone)}
              aria-label={todayDone ? 'Bugünkü işareti kaldır' : 'Bugün tamamlandı'}
              title="Bugün"
            >
              ✓
            </button>
            <div className="protocolTools">
              <button type="button" className="protocolToolBtn" onClick={startEdit} title="Düzenle">
                ✎
              </button>
              <button type="button" className="protocolToolBtn protocolToolDanger" onClick={requestDelete} title="Sil">
                ×
              </button>
            </div>
          </div>
          <div className="protocolWeekBar">
            <button
              type="button"
              className="protocolWeekNav"
              onClick={() => setWeekShift((v) => v + 7)}
              aria-label="Bir hafta geri"
            >
              ‹
            </button>
            <div className="protocolDays" role="group" aria-label="14 günlük görünüm">
              {days.map((d) => {
                const checked = Boolean(habit.history?.[d.key])
                const isToday = d.key === todayKey
                return (
                  <label
                    key={d.key}
                    className={`protocolDay ${checked ? 'isOn' : ''} ${isToday ? 'isToday' : ''}`}
                    title={d.key}
                  >
                    <span className="protocolDayDow">{getTrWeekdayShort(d.date)}</span>
                    <span className="protocolDayDom">{d.date.getDate()}</span>
                    <input
                      type="checkbox"
                      className="protocolDayInput"
                      checked={checked}
                      onChange={() => onToggleDay(habit.id, d.key, !checked)}
                    />
                  </label>
                )
              })}
            </div>
            <button
              type="button"
              className="protocolWeekNav"
              onClick={() => setWeekShift((v) => Math.max(0, v - 7))}
              disabled={!canGoForward}
              aria-label="Bir hafta ileri"
            >
              ›
            </button>
          </div>
        </>
      )}
    </article>
  )
}
