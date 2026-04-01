function pad2(n) {
  return String(n).padStart(2, '0')
}

// Local timezone "date key" to avoid UTC day shifts.
export function toDateKey(date) {
  const y = date.getFullYear()
  const m = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  return `${y}-${m}-${d}`
}

export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map((x) => Number(x))
  return new Date(y, m - 1, d)
}

export function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Yerel takvimde haftayı Pazartesi başlatır (Pzt…Paz). */
export function startOfLocalWeekMonday(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay() // 0=Paz … 6=Cmt
  const daysFromMonday = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - daysFromMonday)
  return d
}

export function toMondayOfWeekDateKey(date = new Date()) {
  return toDateKey(startOfLocalWeekMonday(date))
}

// Returns array from oldest -> newest (today last)
export function getLastNDays(n, baseDate = new Date()) {
  const start = addDays(baseDate, -(n - 1))
  const days = []
  for (let i = 0; i < n; i++) {
    const d = addDays(start, i)
    days.push({ date: d, key: toDateKey(d) })
  }
  return days
}

export function getTrWeekdayShort(date) {
  const map = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
  return map[date.getDay()]
}
