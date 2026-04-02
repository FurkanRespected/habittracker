import { useCallback } from 'react'
import useLocalStorage from './useLocalStorage.js'

const KEY = 'habitracker_xp_v1'

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function useXpLocal() {
  const [raw, setRaw] = useLocalStorage(KEY, { total: 0, events: [] })

  const total = typeof raw?.total === 'number' ? raw.total : 0
  const events = Array.isArray(raw?.events) ? raw.events : []

  const addXp = useCallback(
    (amount, source) => {
      const n = Number(amount)
      if (!Number.isFinite(n) || n <= 0) return
      setRaw((prev) => {
        const t = typeof prev?.total === 'number' ? prev.total : 0
        const ev = Array.isArray(prev?.events) ? prev.events : []
        return {
          total: t + n,
          events: [
            { id: newId(), at: new Date().toISOString(), source: source || 'unknown', amount: n },
            ...ev,
          ].slice(0, 200),
        }
      })
    },
    [setRaw],
  )

  return { total, events, addXp }
}
