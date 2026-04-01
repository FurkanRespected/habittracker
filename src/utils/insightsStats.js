import { addDays, fromDateKey, toDateKey } from './dateUtils.js'

export function startOfWeekMonday(d) {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}

export function dayCompletionRatio(habits, dateKey) {
  const n = habits?.length ?? 0
  if (!n) return 0
  const done = habits.filter((h) => h.history?.[dateKey]).length
  return done / n
}

export function heatLevelFromRatio(r) {
  if (r <= 0) return 0
  if (r < 0.25) return 1
  if (r < 0.5) return 2
  if (r < 1) return 3
  return 4
}

/** Haftalar soldan sağa, her sütun Pazartesi→Pazar (Stitch GitHub tarzı) */
export function buildInsightsYearHeatmap(habits, totalDays = 371) {
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const start = addDays(end, -(totalDays - 1))
  const monday0 = startOfWeekMonday(start)
  const weeks = []
  let cur = new Date(monday0)

  while (cur <= end) {
    const col = []
    for (let i = 0; i < 7; i++) {
      const d = addDays(cur, i)
      if (d < start || d > end) {
        col.push({ key: null, level: -1 })
      } else {
        const key = toDateKey(d)
        const r = dayCompletionRatio(habits, key)
        col.push({ key, level: heatLevelFromRatio(r) })
      }
    }
    weeks.push(col)
    cur = addDays(cur, 7)
    if (weeks.length > 56) break
  }

  const cells = []
  for (let c = 0; c < weeks.length; c++) {
    for (let r = 0; r < 7; r++) {
      cells.push(weeks[c][r])
    }
  }
  return { cells, weekCount: weeks.length }
}

export function last7DayCompletionPercents(habits) {
  const today = new Date()
  const pts = []
  for (let i = 6; i >= 0; i--) {
    const key = toDateKey(addDays(today, -i))
    pts.push(Math.round(dayCompletionRatio(habits, key) * 100))
  }
  return pts
}

export function sparklinePathFromPercents(pts, w = 100, h = 100) {
  if (!pts.length) return ''
  const n = pts.length
  const pad = 4
  const innerW = w - pad * 2
  const innerH = h - pad * 2
  const step = n > 1 ? innerW / (n - 1) : 0
  return pts
    .map((p, i) => {
      const x = pad + i * step
      const y = pad + innerH * (1 - p / 100)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

export function weekdayComplianceRanking(habits, lookback = 90) {
  const totals = [0, 0, 0, 0, 0, 0, 0]
  const counts = [0, 0, 0, 0, 0, 0, 0]
  const today = new Date()
  for (let i = 0; i < lookback; i++) {
    const d = addDays(today, -i)
    const dow = (d.getDay() + 6) % 7
    const key = toDateKey(d)
    counts[dow]++
    totals[dow] += dayCompletionRatio(habits, key)
  }
  const names = [
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
    'Cumartesi',
    'Pazar',
  ]
  return names
    .map((name, i) => ({
      name,
      pct: counts[i] ? Math.round((totals[i] / counts[i]) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct)
}

export function longestStreakInHistory(history) {
  const good = Object.entries(history || {})
    .filter(([, v]) => v)
    .map(([k]) => k)
    .sort()
  if (!good.length) return 0
  let best = 1
  let run = 1
  for (let i = 1; i < good.length; i++) {
    const a = fromDateKey(good[i - 1])
    const b = fromDateKey(good[i])
    const next = addDays(a, 1)
    if (next.getTime() === b.getTime()) run++
    else run = 1
    best = Math.max(best, run)
  }
  return best
}

export function maxLongestStreakAcrossHabits(habits) {
  if (!habits?.length) return 0
  return Math.max(...habits.map((h) => longestStreakInHistory(h.history || {})))
}

export function yearlyFocusPercent(habits, days = 365) {
  const n = habits?.length ?? 0
  if (!n) return 0
  let sum = 0
  for (let i = 0; i < days; i++) {
    sum += dayCompletionRatio(habits, toDateKey(addDays(new Date(), -i)))
  }
  return Math.round((sum / days) * 100)
}

export function estimatedDeepWorkHours(habits, days = 30) {
  let daysWithAny = 0
  for (let i = 0; i < days; i++) {
    const key = toDateKey(addDays(new Date(), -i))
    if (habits?.some((h) => h.history?.[key])) daysWithAny++
  }
  const base = (habits?.length ?? 0) * 2
  return Math.max(0, Math.round(daysWithAny * 3 + base))
}
