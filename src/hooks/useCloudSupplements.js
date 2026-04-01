import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { addDays, toDateKey } from '../utils/dateUtils.js'

function toDateYmd(dateKey) {
  // input: YYYY-MM-DD
  return dateKey
}

/** DB'de `archived` kolonu yoksa Supabase hata veriyor; arşiv bu set ile local tutulur (isteğe bağlı sonra kolon eklenebilir). */
function archivedStorageKey(userId) {
  return `habitracker:supArchived:${userId}`
}

function readArchivedSet(userId) {
  if (!userId || typeof localStorage === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(archivedStorageKey(userId))
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function writeArchivedSet(userId, set) {
  if (!userId || typeof localStorage === 'undefined') return
  localStorage.setItem(archivedStorageKey(userId), JSON.stringify([...set]))
}

function mergeArchivedFromStorage(rows, userId) {
  const set = readArchivedSet(userId)
  return (rows || []).map((r) => ({ ...r, archived: set.has(r.id) }))
}

const SUPPLEMENT_SELECT =
  'id,name,unit,default_amount,dose_per_unit,dose_unit,inventory_amount,inventory_unit,intake_enabled,intake_mode,intake_weekly_day,intake_custom_days,intake_interval_anchor,created_at,updated_at'

/**
 * Bir gün kaydının stok biriminde (g/adet…) tüketim karşılığı.
 * `inventory_amount` sadece “taban stok” için; hesap için inventory_unit yeterli.
 */
function loggedConsumptionInStockUnits(sup, amountUnits) {
  if (!sup || !sup.inventory_unit) return null
  const amt = Number(amountUnits)
  if (!Number.isFinite(amt) || amt <= 0) return 0

  const invU = String(sup.inventory_unit).trim().toLowerCase()
  const dpu = sup.dose_per_unit
  const duRaw = sup.dose_unit

  if (dpu != null && duRaw) {
    const du = String(duRaw).trim().toLowerCase()
    if (du === invU) return amt * Number(dpu)
    return null
  }

  return amt
}

function computeInventoryUsedTotals(mergedSupplements, logRows) {
  const supMap = new Map((mergedSupplements || []).map((s) => [s.id, s]))
  const totals = {}
  for (const row of logRows || []) {
    const sup = supMap.get(row.supplement_id)
    const c = loggedConsumptionInStockUnits(sup, row.amount)
    if (c != null && c > 0) totals[row.supplement_id] = (totals[row.supplement_id] || 0) + c
  }
  return totals
}

function cloneDayLogs(list) {
  return (list || []).map((r) => ({ ...r }))
}

/** Takvimde gösterilen kalan: taban − (tüm tikli günlerin tüketimi). */
function remainingInventoryDisplay(s, usedById) {
  if (s.inventory_amount == null || !s.inventory_unit) return null
  const used = usedById[s.id] ?? 0
  const base = Number(s.inventory_amount)
  if (!Number.isFinite(base)) return null
  return Math.max(0, base - used)
}

export default function useCloudSupplements({ session, logsLookbackDays = 14 }) {
  const userId = session?.user?.id
  const [supplements, setSupplements] = useState([])
  const [logsByDay, setLogsByDay] = useState({})
  /** supplement_id -> tüm zamanlar tüketim toplamı (stok biriminde) */
  const [inventoryUsedBySupplementId, setInventoryUsedBySupplementId] = useState({})
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')

  const supplementsRef = useRef(supplements)
  supplementsRef.current = supplements

  const logsByDayRef = useRef(logsByDay)
  useEffect(() => {
    logsByDayRef.current = logsByDay
  }, [logsByDay])

  const logOpQueueRef = useRef(Promise.resolve())
  const enqueueLogOp = useCallback((fn) => {
    const p = logOpQueueRef.current.then(() => fn())
    logOpQueueRef.current = p.then(
      () => undefined,
      () => undefined,
    )
    return p
  }, [])

  const fromDate = useMemo(() => {
    const from = addDays(new Date(), -logsLookbackDays)
    const ymd = toDateKey(from)
    return `${ymd}T00:00:00.000Z`
  }, [logsLookbackDays])

  const fetchSupplementsMerged = useCallback(async () => {
    if (!supabase || !userId) return null
    const { data, error: e } = await supabase
      .from('supplements')
      .select(SUPPLEMENT_SELECT)
      .order('created_at', { ascending: false })
    if (e) throw e
    const merged = mergeArchivedFromStorage(data || [], userId)
    setSupplements(merged)
    return merged
  }, [userId])

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

  const fetchAndSetInventoryUsedTotals = useCallback(
    async (mergedSupplements) => {
      if (!supabase || !userId || !mergedSupplements) return
      const { data: logRows, error: e2 } = await supabase
        .from('supplement_logs')
        .select('supplement_id, amount')
        .eq('user_id', userId)
        .is('time', null)
      if (e2) throw e2
      setInventoryUsedBySupplementId(computeInventoryUsedTotals(mergedSupplements, logRows))
    },
    [userId],
  )

  const refresh = useCallback(async () => {
    if (!supabase || !userId) return
    setLoading(true)
    setError('')
    try {
      const merged = await fetchSupplementsMerged()
      if (merged == null) return
      await fetchAndSetInventoryUsedTotals(merged)
      await refreshRecentLogs()
    } catch (err) {
      setError(err?.message || 'Takviye verisi yenilenemedi.')
    } finally {
      setLoading(false)
    }
  }, [fetchAndSetInventoryUsedTotals, fetchSupplementsMerged, refreshRecentLogs, userId])

  useEffect(() => {
    if (!supabase || !userId) return
    refresh()
  }, [refresh, userId])

  const bumpInventoryUsed = useCallback((supplementId, delta) => {
    if (delta == null || delta === 0) return
    setInventoryUsedBySupplementId((prev) => {
      const next = { ...(prev || {}) }
      const v = Math.max(0, (next[supplementId] || 0) + delta)
      if (v <= 0) delete next[supplementId]
      else next[supplementId] = v
      return next
    })
  }, [])

  const addSupplement = useCallback(
    async ({
      name,
      unit = 'ölçek',
      default_amount = 1,
      dose_per_unit,
      dose_unit,
      inventory_amount,
      inventory_unit,
      intake_enabled,
      intake_mode,
      intake_weekly_day,
      intake_custom_days,
      intake_interval_anchor,
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
        inventory_amount:
          inventory_amount === '' || inventory_amount == null ? null : Number(inventory_amount),
        inventory_unit: inventory_unit || null,
        intake_enabled: Boolean(intake_enabled),
        intake_mode: intake_mode || null,
        intake_weekly_day: intake_weekly_day ?? null,
        intake_custom_days: intake_custom_days ?? null,
        intake_interval_anchor: intake_interval_anchor || null,
      }
      const { data, error: e } = await supabase
        .from('supplements')
        .insert(payload)
        .select(SUPPLEMENT_SELECT)
        .single()
      if (e) throw e
      const row = { ...data, archived: false }
      setSupplements((prev) => [row, ...(prev || [])])
    },
    [userId],
  )

  const updateSupplement = useCallback(
    async (id, patch) => {
      if (!supabase || !userId) return
      const { archived: archFlag, ...rest } = patch

      if (archFlag !== undefined) {
        const set = readArchivedSet(userId)
        if (archFlag) set.add(id)
        else set.delete(id)
        writeArchivedSet(userId, set)
        setSupplements((prev) =>
          (prev || []).map((s) => (s.id === id ? { ...s, archived: !!archFlag } : s)),
        )
      }

      if (Object.keys(rest).length === 0) return

      const affectsConsumption =
        'dose_per_unit' in rest || 'dose_unit' in rest || 'inventory_unit' in rest

      const { data, error: e } = await supabase
        .from('supplements')
        .update(rest)
        .eq('id', id)
        .select(SUPPLEMENT_SELECT)
        .single()
      if (e) throw e
      const base = mergeArchivedFromStorage([data], userId)[0]
      const mergedList = (supplementsRef.current || []).map((s) =>
        s.id === id ? { ...base, archived: Boolean(s.archived) } : s,
      )
      setSupplements((prev) =>
        (prev || []).map((s) =>
          s.id === id ? { ...base, archived: Boolean(s.archived) } : s,
        ),
      )
      supplementsRef.current = mergedList

      if (affectsConsumption) {
        try {
          await fetchAndSetInventoryUsedTotals(mergedList)
        } catch {
          /* refresh sonrası düzelir */
        }
      }
    },
    [fetchAndSetInventoryUsedTotals, userId],
  )

  const deleteSupplement = useCallback(
    async (id) => {
      if (!supabase || !userId) return
      const { error: e } = await supabase.from('supplements').delete().eq('id', id)
      if (e) throw e
      const set = readArchivedSet(userId)
      set.delete(id)
      writeArchivedSet(userId, set)
      setSupplements((prev) => (prev || []).filter((s) => s.id !== id))
      setInventoryUsedBySupplementId((prev) => {
        const next = { ...(prev || {}) }
        delete next[id]
        return next
      })
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

  const getInventoryRemaining = useCallback(
    (s) => remainingInventoryDisplay(s, inventoryUsedBySupplementId),
    [inventoryUsedBySupplementId],
  )

  const upsertLogForDay = useCallback(
    (params) => {
      const { dateKey, supplementId, amount, notes = null, time = null } = params
      if (!supabase || !userId) return Promise.resolve()

      const nextAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0
      const ymd = toDateYmd(dateKey)
      const sup = supplementsRef.current.find((s) => s.id === supplementId)

      if (time != null) {
        return enqueueLogOp(async () => {
          const { data: ins, error: errIns } = await supabase
            .from('supplement_logs')
            .insert({
              user_id: userId,
              supplement_id: supplementId,
              date: ymd,
              amount: nextAmount,
              notes,
              time,
            })
            .select('id,supplement_id,date,amount,time,notes,created_at')
            .single()
          if (errIns) throw errIns
          const cNext = loggedConsumptionInStockUnits(sup, nextAmount)
          if (cNext !== null && cNext !== 0) bumpInventoryUsed(supplementId, cNext)
          setLogsByDay((prev) => {
            const list = [...(prev?.[dateKey] || [])]
            const idx = list.findIndex((r) => r.id === ins.id)
            if (idx >= 0) list[idx] = ins
            else list.unshift(ins)
            const next = { ...(prev || {}), [dateKey]: list }
            logsByDayRef.current = next
            return next
          })
        })
      }

      const dayLogsBefore = cloneDayLogs(logsByDayRef.current[dateKey])
      const existingRow = dayLogsBefore.find(
        (r) => r.supplement_id === supplementId && r.time == null,
      )

      let invDelta = null
      if (existingRow) {
        const cPrev = loggedConsumptionInStockUnits(sup, Number(existingRow.amount))
        const cNext = loggedConsumptionInStockUnits(sup, nextAmount)
        if (cPrev !== null && cNext !== null) invDelta = cNext - cPrev
      } else {
        const cNext = loggedConsumptionInStockUnits(sup, nextAmount)
        if (cNext !== null) invDelta = cNext
      }

      const optimisticId =
        existingRow?.id && !String(existingRow.id).startsWith('optimistic:')
          ? existingRow.id
          : `optimistic:${crypto.randomUUID()}`
      const optimisticRow = {
        ...(existingRow || {}),
        id: optimisticId,
        supplement_id: supplementId,
        date: ymd,
        amount: nextAmount,
        time: null,
        notes: notes === undefined ? existingRow?.notes ?? null : notes,
        created_at: existingRow?.created_at ?? new Date().toISOString(),
      }

      setLogsByDay((prev) => {
        const list = [...(prev?.[dateKey] || [])]
        const idx = list.findIndex((r) => r.supplement_id === supplementId && r.time == null)
        if (idx >= 0) list[idx] = optimisticRow
        else list.unshift(optimisticRow)
        const next = { ...(prev || {}), [dateKey]: list }
        logsByDayRef.current = next
        return next
      })
      if (invDelta !== null && invDelta !== 0) bumpInventoryUsed(supplementId, invDelta)

      return enqueueLogOp(async () => {
        try {
          let data
          const { data: dbRow, error: qErr } = await supabase
            .from('supplement_logs')
            .select('id,supplement_id,date,amount,time,notes,created_at')
            .eq('user_id', userId)
            .eq('supplement_id', supplementId)
            .eq('date', ymd)
            .is('time', null)
            .maybeSingle()
          if (qErr) throw qErr

          if (dbRow) {
            const { data: updated, error: uErr } = await supabase
              .from('supplement_logs')
              .update({ amount: nextAmount, notes })
              .eq('id', dbRow.id)
              .select('id,supplement_id,date,amount,time,notes,created_at')
              .single()
            if (uErr) throw uErr
            data = updated
          } else {
            const { data: inserted, error: iErr } = await supabase
              .from('supplement_logs')
              .insert({
                user_id: userId,
                supplement_id: supplementId,
                date: ymd,
                amount: nextAmount,
                notes,
                time: null,
              })
              .select('id,supplement_id,date,amount,time,notes,created_at')
              .single()
            if (iErr) throw iErr
            data = inserted
          }

          setLogsByDay((prev) => {
            const list = [...(prev?.[dateKey] || [])]
            const idx = list.findIndex((r) => r.supplement_id === supplementId && r.time == null)
            if (idx >= 0) list[idx] = data
            else list.unshift(data)
            const next = { ...(prev || {}), [dateKey]: list }
            logsByDayRef.current = next
            return next
          })
        } catch (err) {
          setLogsByDay((prev) => {
            const next = { ...(prev || {}), [dateKey]: dayLogsBefore }
            logsByDayRef.current = next
            return next
          })
          if (invDelta !== null && invDelta !== 0) bumpInventoryUsed(supplementId, -invDelta)
          throw err
        }
      })
    },
    [bumpInventoryUsed, enqueueLogOp, userId],
  )

  const deleteLogForDay = useCallback(
    (params) => {
      const { dateKey, supplementId } = params
      if (!supabase || !userId) return Promise.resolve()
      const ymd = toDateYmd(dateKey)

      const dayLogsBefore = cloneDayLogs(logsByDayRef.current[dateKey])
      const existing = dayLogsBefore.find((r) => r.supplement_id === supplementId && r.time == null)
      if (!existing) return Promise.resolve()

      const sup = supplementsRef.current.find((s) => s.id === supplementId)
      const returned = loggedConsumptionInStockUnits(sup, Number(existing.amount))

      setLogsByDay((prev) => {
        const next = {
          ...prev,
          [dateKey]: (prev?.[dateKey] || []).filter(
            (r) => !(r.supplement_id === supplementId && r.time == null),
          ),
        }
        logsByDayRef.current = next
        return next
      })
      if (returned != null && returned !== 0) bumpInventoryUsed(supplementId, -returned)

      return enqueueLogOp(async () => {
        try {
          const { data: row, error: qErr } = await supabase
            .from('supplement_logs')
            .select('id')
            .eq('user_id', userId)
            .eq('supplement_id', supplementId)
            .eq('date', ymd)
            .is('time', null)
            .maybeSingle()
          if (qErr) throw qErr
          if (!row) return
          const { error: delErr } = await supabase.from('supplement_logs').delete().eq('id', row.id)
          if (delErr) throw delErr
        } catch (err) {
          setLogsByDay((prev) => {
            const next = { ...(prev || {}), [dateKey]: dayLogsBefore }
            logsByDayRef.current = next
            return next
          })
          if (returned != null && returned !== 0) bumpInventoryUsed(supplementId, returned)
          throw err
        }
      })
    },
    [bumpInventoryUsed, enqueueLogOp, userId],
  )

  const bumpLog = useCallback(
    async ({ dateKey, supplementId, delta }) => {
      const logs = getLogsForDay(dateKey)
      const existing = logs.find((r) => r.supplement_id === supplementId)
      const sup = supplements.find((s) => s.id === supplementId)
      const base = Number(sup?.default_amount) || 1
      const cur = existing ? Number(existing.amount) : base
      const next = Math.max(0, Number(cur) + Number(delta))
      await upsertLogForDay({ dateKey, supplementId, amount: next })
    },
    [getLogsForDay, supplements, upsertLogForDay],
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
    logsByDay,
    addSupplement,
    updateSupplement,
    deleteSupplement,
    refreshLogs,
    getLogsForDay,
    getInventoryRemaining,
    upsertLogForDay,
    bumpLog,
    deleteLogForDay,
    last7,
  }
}
