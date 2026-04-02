import { APPEARANCE_STORAGE_KEY } from './appearancePreferencesUtils.js'

const PANEL_WIDGETS_KEY = 'habitracker-panel-widgets-v1'
const TRAINING_KEY = 'training_store_v1'
const HABITS_LOCAL_KEY = 'habits'
const TASKS_KEY = 'habitracker_tasks_v1'
const XP_KEY = 'habitracker_xp_v1'
const WORKOUT_TEMPLATES_KEY = 'workout_templates_v1'

function newHabitId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeImportedHabits(list) {
  if (!Array.isArray(list)) return []
  return list
    .filter((h) => h && typeof h.name === 'string' && h.name.trim())
    .map((h) => ({
      id: typeof h.id === 'string' && h.id.trim() ? h.id.trim() : newHabitId(),
      name: String(h.name).trim(),
      history: h.history && typeof h.history === 'object' && !Array.isArray(h.history) ? { ...h.history } : {},
    }))
}

/**
 * @returns {{ ok: true, normalized: object } | { ok: false, error: string }}
 */
export function validateImportBundle(data) {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Dosya okunamadı veya JSON değil.' }
  }
  if (data.app !== 'habitracker') {
    return { ok: false, error: 'Bu dosya habitracker dışa aktarımı gibi görünmüyor.' }
  }
  if (typeof data.exportVersion !== 'number' || data.exportVersion < 1) {
    return { ok: false, error: 'Desteklenmeyen dışa aktarım sürümü.' }
  }

  let rawHabits = Array.isArray(data.habits) ? data.habits : []
  if (rawHabits.length === 0 && Array.isArray(data.habitsLocalSnapshot)) {
    rawHabits = data.habitsLocalSnapshot
  }

  const habits = normalizeImportedHabits(rawHabits)

  return {
    ok: true,
    normalized: {
      habits,
      trainingStore: data.trainingStore,
      panelWidgets: data.panelWidgets,
      appearance: data.appearance,
      tasks: data.tasks,
      xp: data.xp,
      workoutTemplates: data.workoutTemplates,
    },
  }
}

/**
 * @returns {{ ok: true, applied: string[] } | { ok: false, error: string }}
 */
export function applyImportBundle(parsedJson) {
  const v = validateImportBundle(parsedJson)
  if (!v.ok) return v

  const { habits, trainingStore, panelWidgets, appearance, tasks, xp, workoutTemplates } =
    v.normalized
  const applied = []

  try {
    window.localStorage.setItem(HABITS_LOCAL_KEY, JSON.stringify(habits))
    applied.push('protokoller (yerel)')
  } catch (e) {
    return { ok: false, error: e?.message || 'localStorage yazılamadı.' }
  }

  try {
    if (trainingStore != null && typeof trainingStore === 'object') {
      window.localStorage.setItem(TRAINING_KEY, JSON.stringify(trainingStore))
      applied.push('antrenman günlüğü')
    }
    if (panelWidgets != null && typeof panelWidgets === 'object') {
      window.localStorage.setItem(PANEL_WIDGETS_KEY, JSON.stringify(panelWidgets))
      applied.push('panel görünümü')
    }
    if (appearance != null && typeof appearance === 'object') {
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance))
      applied.push('görünüm tercihleri')
    }
    if (tasks != null && typeof tasks === 'object') {
      window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
      applied.push('görevler')
    }
    if (xp != null && typeof xp === 'object') {
      window.localStorage.setItem(XP_KEY, JSON.stringify(xp))
      applied.push('XP')
    }
    if (workoutTemplates != null && typeof workoutTemplates === 'object') {
      window.localStorage.setItem(WORKOUT_TEMPLATES_KEY, JSON.stringify(workoutTemplates))
      applied.push('antrenman şablonları')
    }
  } catch (e) {
    return { ok: false, error: e?.message || 'Ek veriler yazılamadı.' }
  }

  return { ok: true, applied }
}

function readLocalStorageJson(key, fallback = null) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function buildExportBundle({ habits, sessionEmail, hasCloud }) {
  return {
    exportedAt: new Date().toISOString(),
    exportVersion: 1,
    app: 'habitracker',
    hasCloud: Boolean(hasCloud),
    sessionEmail: sessionEmail || null,
    habits: Array.isArray(habits) ? habits : [],
    habitsLocalSnapshot: readLocalStorageJson(HABITS_LOCAL_KEY, null),
    trainingStore: readLocalStorageJson(TRAINING_KEY, null),
    panelWidgets: readLocalStorageJson(PANEL_WIDGETS_KEY, null),
    appearance: readLocalStorageJson(APPEARANCE_STORAGE_KEY, null),
    tasks: readLocalStorageJson(TASKS_KEY, null),
    xp: readLocalStorageJson(XP_KEY, null),
    workoutTemplates: readLocalStorageJson(WORKOUT_TEMPLATES_KEY, null),
  }
}

export function downloadJson(filename, data) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function readJsonFile(file) {
  const text = await file.text()
  return JSON.parse(text)
}
