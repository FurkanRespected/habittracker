import { toDateKey, toMondayOfWeekDateKey } from './dateUtils.js'

/** Takviye alış sıklığı (hatırlatıcıdan bağımsız; değerler DB ile uyumlu) */
export const INTAKE_MODE = {
  DAILY: 'daily',
  WEEKDAYS: 'weekdays',
  WEEKENDS: 'weekends',
  WEEKLY: 'weekly',
  EVERY_2_DAYS: 'every_2_days',
  EVERY_3_DAYS: 'every_3_days',
  CUSTOM_DAYS: 'custom_days',
}

/** JS getDay(): 0=Pazar … 6=Cumartesi — Türkçe kısa etiket */
export const INTAKE_DOW_OPTIONS = [
  { value: 0, label: 'Paz' },
  { value: 1, label: 'Pzt' },
  { value: 2, label: 'Sal' },
  { value: 3, label: 'Çar' },
  { value: 4, label: 'Per' },
  { value: 5, label: 'Cum' },
  { value: 6, label: 'Cmt' },
]

export function normalizeCustomDays(raw) {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((x) => Number(x)).filter((d) => d >= 0 && d <= 6))].sort((a, b) => a - b)
  }
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      return normalizeCustomDays(p)
    } catch {
      return []
    }
  }
  return []
}

/**
 * API / insert için alış sıklığı alanları (saat yok — ileride hatırlatıcı ayrı gelecek)
 */
export function buildIntakeScheduleDbFields({
  enabled,
  mode,
  weeklyDay,
  customDays,
  intervalAnchor,
}) {
  if (!enabled) {
    return {
      intake_enabled: false,
      intake_mode: null,
      intake_weekly_day: null,
      intake_custom_days: null,
      intake_interval_anchor: null,
    }
  }

  const m = mode || INTAKE_MODE.DAILY
  const custom = normalizeCustomDays(customDays)
  const mondayKey = toMondayOfWeekDateKey(new Date())
  const needsAnchor = m === INTAKE_MODE.EVERY_2_DAYS || m === INTAKE_MODE.EVERY_3_DAYS

  return {
    intake_enabled: true,
    intake_mode: m,
    intake_weekly_day: m === INTAKE_MODE.WEEKLY ? Number(weeklyDay) % 7 : null,
    intake_custom_days: m === INTAKE_MODE.CUSTOM_DAYS && custom.length ? custom : null,
    intake_interval_anchor: needsAnchor ? intervalAnchor || mondayKey : null,
  }
}
