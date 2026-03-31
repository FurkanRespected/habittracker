import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, toDateKey } from '../utils/dateUtils.js'
import { supabase } from '../lib/supabaseClient.js'

function historyFromChecks(checkRows) {
  const map = new Map()
  for (const row of checkRows) {
    if (!map.has(row.habit_id)) map.set(row.habit_id, {})
    map.get(row.habit_id)[row.date_key] = Boolean(row.done)
  }
  return map
}

export default function useCloudHabits({ session, checksLookbackDays = 120 }) {
  const userId = session?.user?.id
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')

  const fromDateKey = useMemo(() => {
    const from = addDays(new Date(), -checksLookbackDays)
    return toDateKey(from)
  }, [checksLookbackDays])

  const refresh = useCallback(async () => {
    if (!supabase || !userId) return
    setLoading(true)
    setError('')
    try {
      const { data: habitRows, error: habitsError } = await supabase
        .from('habits')
        .select('id,name,created_at')
        .order('created_at', { ascending: false })
      if (habitsError) throw habitsError

      const { data: checkRows, error: checksError } = await supabase
        .from('habit_checks')
        .select('habit_id,date_key,done')
        .gte('date_key', fromDateKey)
      if (checksError) throw checksError

      const historyByHabit = historyFromChecks(checkRows || [])
      setHabits(
        (habitRows || []).map((h) => ({
          id: h.id,
          name: h.name,
          history: historyByHabit.get(h.id) || {},
        })),
      )
    } catch (err) {
      setError(err?.message || 'Veriler alınamadı.')
    } finally {
      setLoading(false)
    }
  }, [fromDateKey, userId])

  useEffect(() => {
    if (!supabase || !userId) return
    refresh()
  }, [refresh, userId])

  const addHabit = useCallback(async (name) => {
    if (!supabase) return
    const trimmed = name.trim()
    if (!trimmed) return
    const { data, error: insertError } = await supabase
      .from('habits')
      .insert({ name: trimmed })
      .select('id,name')
      .single()
    if (insertError) throw insertError
    setHabits((prev) => [{ id: data.id, name: data.name, history: {} }, ...prev])
  }, [])

  const renameHabit = useCallback(async (habitId, nextName) => {
    if (!supabase) return
    const name = nextName.trim()
    if (!name) return
    const { error: updateError } = await supabase
      .from('habits')
      .update({ name })
      .eq('id', habitId)
    if (updateError) throw updateError
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, name } : h)))
  }, [])

  const deleteHabit = useCallback(async (habitId) => {
    if (!supabase) return
    const { error: deleteError } = await supabase.from('habits').delete().eq('id', habitId)
    if (deleteError) throw deleteError
    setHabits((prev) => prev.filter((h) => h.id !== habitId))
  }, [])

  const toggleHabitDay = useCallback(
    async (habitId, dateKey, desiredDone) => {
      if (!supabase) return
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h
          const nextHistory = { ...(h.history || {}) }
          nextHistory[dateKey] = Boolean(desiredDone)
          return { ...h, history: nextHistory }
        }),
      )

      // Upsert to unique(user_id, habit_id, date_key)
      const { error: upsertError } = await supabase.from('habit_checks').upsert(
        { habit_id: habitId, date_key: dateKey, done: desiredDone },
        { onConflict: 'user_id,habit_id,date_key' },
      )
      if (upsertError) {
        // revert by refreshing (keeps logic simple)
        refresh()
        throw upsertError
      }
    },
    [refresh],
  )

  return {
    habits,
    loading,
    error,
    refresh,
    addHabit,
    renameHabit,
    deleteHabit,
    toggleHabitDay,
  }
}

