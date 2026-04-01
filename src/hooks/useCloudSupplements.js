import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { addDays, toDateKey } from '../utils/dateUtils.js'

function toDateYmd(dateKey) {
  // input: YYYY-MM-DD
  return dateKey
}

export default function useCloudSupplements({ session, logsLookbackDays = 14 }) {
  const userId = session?.user?.id
  const [supplements, setSupplements] = useState([])
  const [logsByDay, setLogsByDay] = useState({}) // dateKey -> array
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')

  const fromDate = useMemo(() => {
    const from = addDays(new Date(), -logsLookbackDays)
    const ymd = toDateKey(from)
    return `${ymd}T00:00:00.000Z`
  }, [logsLookbackDays])

  const refreshSupplements = useCallback(async () => {
    if (!supabase || !userId) return
    setLoading(true)
    setError('')
    try {
      const { data, error: e } = await supabase
        .from('supplements')
        .select(
          'id,name,unit,default_amount,dose_per_unit,dose_unit,inventory_count,created_at,updated_at',
        )
        .order('created_at', { ascending: false })
      if (e) throw e
      setSupplements(data || [])
    } catch (err) {
      setError(err?.message || 'Takviyeler alınamadı.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const refreshLogs = useCallback(
    async (dateKey) => {
      if (!supabase || !userId) return
      setError('')
      try {
        const { data, error: e } = await supabase
          .from('supplement_logs')
          .select('id,supplement_id,date,amount,time,notes,created_at')
          .eq('date', toDateYmd(dateKey))
          .order('created_at', { ascending: false })
        if (e) throw e
        setLogsByDay((prev) => ({ ...(prev || {}), [dateKey]: data || [] }))
      } catch (err) {
        setError(err?.message || 'Takviye kayıtları alınamadı.')
      }
    },
    [userId],
  )

  const refreshRecentLogs = useCallback(async () => {
    if (!supabase || !userId) return
    setError('')
    try {
      const { data, error: e } = await supabase
        .from('supplement_logs')
        .select('id,supplement_id,date,amount,time,notes,created_at')
        .gte('date', fromDate)
        .order('date', { ascending: false })
      if (e) throw e
      const map = {}
      for (const row of data || []) {
        const key = String(row.date).slice(0, 10)
        if (!map[key]) map[key] = []
        map[key].push(row)
      }
      setLogsByDay((prev) => ({ ...(prev || {}), ...map }))
    } catch (err) {
      setError(err?.message || 'Takviye kayıtları alınamadı.')
    }
  }, [fromDate, userId])

  const refresh = useCallback(async () => {
    await refreshSupplements()
    await refreshRecentLogs()
  }, [refreshRecentLogs, refreshSupplements])

  useEffect(() => {
    if (!supabase || !userId) return
    refresh()
  }, [refresh, userId])

  const addSupplement = useCallback(
    async ({
      name,
      unit = 'ölçek',
      default_amount = 1,
      dose_per_unit,
      dose_unit,
      inventory_count,
    }) => {
      if (!supabase || !userId) return
      const trimmed = (name || '').trim()
      if (!trimmed) return
      const payload = {
        name: trimmed,
        unit: unit || 'ölçek',
        default_amount: Number.isFinite(Number(default_amount)) ? Number(default_amount) : 1,
        dose_per_unit:
          dose_per_unit === '' || dose_per_unit == null ? null : Number(dose_per_unit),
        dose_unit: dose_unit || null,
        inventory_count:
          inventory_count === '' || inventory_count == null ? null : Number(inventory_count),
      }
      const { data, error: e } = await supabase
        .from('supplements')
        .insert(payload)
        .select(
          'id,name,unit,default_amount,dose_per_unit,dose_unit,inventory_count,created_at,updated_at',
        )
        .single()
      if (e) throw e
      setSupplements((prev) => [data, ...(prev || [])])
    },
    [userId],
  )

  const updateSupplement = useCallback(
    async (id, patch) => {
      if (!supabase || !userId) return
      const { data, error: e } = await supabase
        .from('supplements')
        .update(patch)
        .eq('id', id)
        .select(
          'id,name,unit,default_amount,dose_per_unit,dose_unit,inventory_count,created_at,updated_at',
        )
        .single()
      if (e) throw e
      setSupplements((prev) => (prev || []).map((s) => (s.id === id ? data : s)))
    },
    [userId],
  )

  const deleteSupplement = useCallback(
    async (id) => {
      if (!supabase || !userId) return
      const { error: e } = await supabase.from('supplements').delete().eq('id', id)
      if (e) throw e
      setSupplements((prev) => (prev || []).filter((s) => s.id !== id))
      setLogsByDay((prev) => {
        const next = { ...(prev || {}) }
        for (const k of Object.keys(next)) {
          next[k] = (next[k] || []).filter((r) => r.supplement_id !== id)
        }
        return next
      })
    },
    [userId],
  )

  const getLogsForDay = useCallback((dateKey) => logsByDay?.[dateKey] || [], [logsByDay])

  const upsertLogForDay = useCallback(
    async ({ dateKey, supplementId, amount, notes = null, time = null }) => {
      if (!supabase || !userId) return
      const dayLogs = logsByDay?.[dateKey] || []
      const existing = dayLogs.find(
        (r) => r.supplement_id === supplementId && (r.time == null) === (time == null),
      )
      const prevAmount = existing?.amount ?? 0
      const nextAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0

      const { data, error: e } = await supabase
        .from('supplement_logs')
        .upsert(
          { supplement_id: supplementId, date: toDateYmd(dateKey), amount: nextAmount, notes, time },
          { onConflict: 'user_id,supplement_id,date' },
        )
        .select('id,supplement_id,date,amount,time,notes,created_at')
        .single()
      if (e) throw e

      setLogsByDay((prev) => {
        const list = [...(prev?.[dateKey] || [])]
        const idx = list.findIndex((r) => r.id === data.id)
        if (idx >= 0) list[idx] = data
        else list.unshift(data)
        return { ...(prev || {}), [dateKey]: list }
      })

      // inventory adjustment (best-effort)
      const delta = nextAmount - prevAmount
      if (delta !== 0) {
        const sup = supplements.find((s) => s.id === supplementId)
        const inv = sup?.inventory_count
        if (inv != null && Number.isFinite(Number(inv))) {
          const nextInv = Math.max(0, Number(inv) - delta)
          await updateSupplement(supplementId, { inventory_count: nextInv })
        }
      }
    },
    [logsByDay, supplements, updateSupplement, userId],
  )

  const bumpLog = useCallback(
    async ({ dateKey, supplementId, delta }) => {
      const logs = getLogsForDay(dateKey)
      const existing = logs.find((r) => r.supplement_id === supplementId)
      const cur = existing?.amount ?? 0
      await upsertLogForDay({ dateKey, supplementId, amount: Number(cur) + Number(delta) })
    },
    [getLogsForDay, upsertLogForDay],
  )

  const last7 = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) days.push(toDateKey(addDays(new Date(), -i)))
    return days
  }, [])

  return {
    loading,
    error,
    refresh,
    supplements,
    addSupplement,
    updateSupplement,
    deleteSupplement,
    refreshLogs,
    getLogsForDay,
    upsertLogForDay,
    bumpLog,
    last7,
  }
}

