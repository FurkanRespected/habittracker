export const APPEARANCE_STORAGE_KEY = 'habitracker-appearance-v1'

export const DEFAULT_APPEARANCE = {
  reduceMotion: false,
  compactDensity: false,
  notifyProductTips: true,
}

export function normalizeAppearance(raw) {
  const out = { ...DEFAULT_APPEARANCE }
  if (!raw || typeof raw !== 'object') return out
  if (typeof raw.reduceMotion === 'boolean') out.reduceMotion = raw.reduceMotion
  if (typeof raw.compactDensity === 'boolean') out.compactDensity = raw.compactDensity
  if (typeof raw.notifyProductTips === 'boolean') out.notifyProductTips = raw.notifyProductTips
  return out
}
