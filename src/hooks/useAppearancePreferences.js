import { useCallback, useEffect, useMemo } from 'react'
import useLocalStorage from './useLocalStorage.js'
import {
  APPEARANCE_STORAGE_KEY,
  normalizeAppearance,
} from '../utils/appearancePreferencesUtils.js'

export default function useAppearancePreferences() {
  const [raw, setRaw] = useLocalStorage(APPEARANCE_STORAGE_KEY, {})
  const prefs = useMemo(() => normalizeAppearance(raw), [raw])

  useEffect(() => {
    const el = document.documentElement
    if (prefs.reduceMotion) el.setAttribute('data-reduce-motion', 'true')
    else el.removeAttribute('data-reduce-motion')
    el.setAttribute('data-density', prefs.compactDensity ? 'compact' : 'comfortable')
  }, [prefs.reduceMotion, prefs.compactDensity])

  const patch = useCallback(
    (partial) => {
      setRaw((prev) => ({ ...normalizeAppearance(prev), ...partial }))
    },
    [setRaw],
  )

  return { prefs, patch }
}
