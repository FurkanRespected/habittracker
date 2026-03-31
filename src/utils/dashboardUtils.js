import { addDays, toDateKey } from './dateUtils.js'

function getCurrentStreakForHistory(history) {
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 3650; i++) {
    const key = toDateKey(addDays(today, -i))
    if (!history?.[key]) break
    streak++
  }
  return streak
}

export function maxStreakAcrossHabits(habits) {
  if (!habits?.length) return 0
  return Math.max(...habits.map((h) => getCurrentStreakForHistory(h.history || {})))
}

export function todayCompletionStats(habits, todayKey = toDateKey(new Date())) {
  const total = habits?.length ?? 0
  if (!total) return { done: 0, total: 0, pct: 0 }
  const done = habits.filter((h) => Boolean(h.history?.[todayKey])).length
  return { done, total, pct: Math.round((done / total) * 100) }
}

/** levels 0-4 for heatmap cell */
export function buildMergedHeatmap(habits, totalDays = 56) {
  const today = new Date()
  const cells = []
  const n = habits?.length || 0
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = addDays(today, -i)
    const key = toDateKey(d)
    const doneCount = n ? habits.filter((h) => h.history?.[key]).length : 0
    const level =
      n === 0 ? 0 : Math.min(4, Math.ceil((doneCount / n) * 4) || (doneCount > 0 ? 1 : 0))
    cells.push({ key, level })
  }
  return cells
}

export function protocolIconLetter(name) {
  const t = (name || '?').trim()
  return t.slice(0, 1).toUpperCase()
}
