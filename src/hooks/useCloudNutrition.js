import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { addDays, toDateKey } from '../utils/dateUtils.js'

export default function useCloudNutrition({ session, lookbackDays = 14 }) {
  const userId = session?.user?.id
  const [daysByKey, setDaysByKey] = useState({})
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')

  const fromDate = useMemo(() => {
    const from = addDays(new Date(), -lookbackDays)
    const ymd = toDateKey(from)
    return `${ymd}T00:00:00.000Z`
  }, [lookbackDays])

  const refresh = useCallback(async () => {
    if (!supabase || !userId) return
    setLoading(true)
    setError('')
    try {
      const { data, error: e } = await supabase
        .from('nutrition_logs')
        .select('date,calories,protein_g,carb_g,fat_g,notes,updated_at')
        .gte('date', fromDate)
        .order('date', { ascending: false })
      if (e) throw e

      const map = {}
      for (const row of data || []) {
        const key = String(row.date).slice(0, 10)
        map[key] = {
          dateKey: key,
          calories: row.calories ?? 0,
          protein_g: row.protein_g ?? null,
          carb_g: row.carb_g ?? null,
          fat_g: row.fat_g ?? null,
          notes: row.notes ?? '',
          updated_at: row.updated_at,
        }
      }
      setDaysByKey(map)
    } catch (err) {
      setError(err?.message || 'Kalori verileri alınamadı.')
    } finally {
      setLoading(false)
    }
  }, [fromDate, userId])

  useEffect(() => {
    if (!supabase || !userId) return
    refresh()
  }, [refresh, userId])

  const getDay = useCallback((dateKey) => daysByKey?.[dateKey] || null, [daysByKey])

  const upsertDay = useCallback(
    async ({ dateKey, calories, protein_g, carb_g, fat_g, notes }) => {
      if (!supabase || !userId) return
      const payload = {
        date: dateKey,
        calories: Number.isFinite(Number(calories)) ? Number(calories) : 0,
        protein_g: protein_g === '' || protein_g == null ? null : Number(protein_g),
        carb_g: carb_g === '' || carb_g == null ? null : Number(carb_g),
        fat_g: fat_g === '' || fat_g == null ? null : Number(fat_g),
        notes: notes || null,
      }
      const { data, error: e } = await supabase
        .from('nutrition_logs')
        .upsert(payload, { onConflict: 'user_id,date' })
        .select('date,calories,protein_g,carb_g,fat_g,notes,updated_at')
        .single()
      if (e) throw e
      const key = String(data.date).slice(0, 10)
      setDaysByKey((prev) => ({
        ...(prev || {}),
        [key]: {
          dateKey: key,
          calories: data.calories ?? 0,
          protein_g: data.protein_g ?? null,
          carb_g: data.carb_g ?? null,
          fat_g: data.fat_g ?? null,
          notes: data.notes ?? '',
          updated_at: data.updated_at,
        },
      }))
    },
    [userId],
  )

  const last7 = useMemo(() => {
    const out = []
    for (let i = 6; i >= 0; i--) {
      const key = toDateKey(addDays(new Date(), -i))
      out.push({ dateKey: key, calories: daysByKey?.[key]?.calories ?? 0 })
    }
    return out
  }, [daysByKey])

  return { loading, error, refresh, getDay, upsertDay, last7 }
}

