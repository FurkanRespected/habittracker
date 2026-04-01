import { useCallback, useEffect, useMemo, useState } from 'react'
import useLocalStorage from '../hooks/useLocalStorage.js'
import { maxStreakAcrossHabits } from '../utils/dashboardUtils.js'
import { addDays, toDateKey } from '../utils/dateUtils.js'

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatMmSs(totalSec) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function calcExerciseVolume(ex) {
  return (ex.sets || []).reduce((sum, s) => {
    const w = Number(String(s.weightKg || '').replace(',', '.'))
    const r = Number(String(s.reps || '').replace(',', '.'))
    if (!Number.isFinite(w) || !Number.isFinite(r)) return sum
    if (w <= 0 || r <= 0) return sum
    return sum + w * r
  }, 0)
}

function formatKg(kg) {
  if (!Number.isFinite(kg)) return '—'
  return `${Math.round(kg)} kg`
}

function WorkoutPanel({ habits, focusSec, running, onToggleTimer }) {
  function makeExercise(seq) {
    return {
      id: newId(),
      n: String(seq).padStart(2, '0'),
      name: '',
      rpe: '',
      sets: [{ weightKg: '', reps: '' }],
    }
  }

  const streak = useMemo(() => maxStreakAcrossHabits(habits), [habits])
  const todayKey = useMemo(() => toDateKey(new Date()), [])
  const [trainingStore, setTrainingStore] = useLocalStorage('training_store_v1', { byDate: {} })
  const day = trainingStore.byDate?.[todayKey] || { exercises: [] }
  const exercises = useMemo(() => day.exercises || [], [day.exercises])
  const [historyFor, setHistoryFor] = useState(null)

  const totalVolumeKg = useMemo(
    () => exercises.reduce((sum, ex) => sum + calcExerciseVolume(ex), 0),
    [exercises],
  )
  const totalTons = useMemo(() => {
    if (!Number.isFinite(totalVolumeKg) || totalVolumeKg <= 0) return 0
    return Math.round((totalVolumeKg / 1000) * 10) / 10
  }, [totalVolumeKg])

  const setDay = useCallback(
    (updater) => {
      setTrainingStore((prev) => {
        const byDate = { ...(prev?.byDate || {}) }
        const cur = byDate[todayKey] || { exercises: [] }
        const nextDay = typeof updater === 'function' ? updater(cur) : updater
        byDate[todayKey] = nextDay
        return { ...(prev || {}), byDate }
      })
    },
    [setTrainingStore, todayKey],
  )

  const addExercise = useCallback(() => {
    setDay((cur) => {
      const next = { ...cur }
      const list = [...(cur.exercises || [])]
      list.push(makeExercise(list.length + 1))
      next.exercises = list
      return next
    })
  }, [setDay])

  const deleteExercise = useCallback(
    (exerciseId) => {
      setDay((cur) => {
        const list = (cur.exercises || []).filter((e) => e.id !== exerciseId)
        const renum = list.map((e, idx) => ({ ...e, n: String(idx + 1).padStart(2, '0') }))
        return { ...cur, exercises: renum }
      })
      setHistoryFor((v) => (v === exerciseId ? null : v))
    },
    [setDay],
  )

  const setExerciseField = useCallback(
    (exerciseId, patch) => {
      setDay((cur) => ({
        ...cur,
        exercises: (cur.exercises || []).map((e) => (e.id === exerciseId ? { ...e, ...patch } : e)),
      }))
    },
    [setDay],
  )

  const setSetField = useCallback(
    (exerciseId, setIdx, patch) => {
      setDay((cur) => ({
        ...cur,
        exercises: (cur.exercises || []).map((e) => {
          if (e.id !== exerciseId) return e
          const sets = [...(e.sets || [])]
          sets[setIdx] = { ...(sets[setIdx] || {}), ...patch }
          return { ...e, sets }
        }),
      }))
    },
    [setDay],
  )

  const addSet = useCallback(
    (exerciseId) => {
      setDay((cur) => ({
        ...cur,
        exercises: (cur.exercises || []).map((e) => {
          if (e.id !== exerciseId) return e
          const sets = [...(e.sets || []), { weightKg: '', reps: '' }]
          return { ...e, sets }
        }),
      }))
    },
    [setDay],
  )

  const deleteSet = useCallback(
    (exerciseId, setIdx) => {
      setDay((cur) => ({
        ...cur,
        exercises: (cur.exercises || []).map((e) => {
          if (e.id !== exerciseId) return e
          const sets = (e.sets || []).filter((_, i) => i !== setIdx)
          return { ...e, sets: sets.length ? sets : [{ weightKg: '', reps: '' }] }
        }),
      }))
    },
    [setDay],
  )

  const historyRows = useMemo(() => {
    if (!historyFor) return []
    const all = trainingStore.byDate || {}
    const keys = Object.keys(all).filter((k) => k !== todayKey).sort().reverse()
    const rows = []
    for (const k of keys) {
      const dayX = all[k]
      const ex = (dayX?.exercises || []).find((e) => e.id === historyFor)
      if (!ex) continue
      const vol = calcExerciseVolume(ex)
      rows.push({ dateKey: k, volumeKg: vol })
      if (rows.length >= 5) break
    }
    return rows
  }, [historyFor, todayKey, trainingStore.byDate])

  return (
    <div className="trBento">
      <div className="trLog">
        <div className="trLogHead">
          <div>
            <h2>Günlük antrenman günlüğü</h2>
            <p className="trLogMeta">
              Oturum: bugünün setleri · kayıt: {todayKey} · hacim: {totalTons ? totalTons : '—'}t
            </p>
          </div>
          <button type="button" className="trLogAdd" aria-label="Egzersiz ekle" onClick={addExercise}>
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        <div className="trExList">
          {exercises.length ? (
            exercises.map((ex) => {
              const exVol = calcExerciseVolume(ex)
              const hasHistory = Boolean(historyFor && historyFor === ex.id)
              return (
                <div key={ex.id} className="trEx">
                  <div className="trExHead">
                    <div className="trExTitleRow">
                      <span className="trExNum">{ex.n}</span>
                      <div className="trExNameBlock">
                        <input
                          className="trExNameInput"
                          value={ex.name}
                          onChange={(e) => setExerciseField(ex.id, { name: e.target.value })}
                          placeholder="Egzersiz adı (örn. Deadlift)"
                        />
                      </div>
                    </div>
                    <div className="trExMetaRow">
                      <span className="trExMeta">
                        {ex.sets?.length || 0} set · RPE{' '}
                        <input
                          className="trExRpeInput"
                          value={ex.rpe}
                          onChange={(e) => setExerciseField(ex.id, { rpe: e.target.value })}
                          placeholder="—"
                          inputMode="numeric"
                        />
                      </span>
                      <div className="trExTools">
                        <button
                          type="button"
                          className="trMiniIconBtn"
                          onClick={() => setHistoryFor((v) => (v === ex.id ? null : ex.id))}
                          aria-label="Geçmiş"
                          title="Geçmiş"
                        >
                          <span className="material-symbols-outlined">history</span>
                        </button>
                        <button
                          type="button"
                          className="trMiniIconBtn trMiniIconBtnDanger"
                          onClick={() => deleteExercise(ex.id)}
                          aria-label="Egzersizi sil"
                          title="Sil"
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="trSetGrid">
                    {(ex.sets || []).map((s, idx) => (
                      <div
                        key={`${ex.id}-${idx}`}
                        className={`trSetCell ${idx === (ex.sets?.length || 1) - 1 ? 'trSetHi' : ''}`}
                      >
                        <div className="trSetLbl">SET {idx + 1}</div>
                        <div className="trSetInputs">
                          <input
                            className="trSetInput"
                            value={s.weightKg ?? ''}
                            onChange={(e) => setSetField(ex.id, idx, { weightKg: e.target.value })}
                            placeholder="KG"
                            inputMode="decimal"
                          />
                          <span className="trSetX">×</span>
                          <input
                            className="trSetInput"
                            value={s.reps ?? ''}
                            onChange={(e) => setSetField(ex.id, idx, { reps: e.target.value })}
                            placeholder="REP"
                            inputMode="numeric"
                          />
                        </div>
                        <div className="trSetBtns">
                          <button
                            type="button"
                            className="trSetBtn"
                            onClick={() => deleteSet(ex.id, idx)}
                            aria-label="Set sil"
                            title="Set sil"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="trSetHist"
                      onClick={() => addSet(ex.id)}
                      aria-label="Set ekle"
                      title="Set ekle"
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                  <div className="trExFoot">
                    <span className="trExVolLbl">Hacim</span>
                    <span className="trExVolVal">{exVol ? formatKg(exVol) : '—'}</span>
                  </div>
                  {hasHistory ? (
                    <div className="trHistory">
                      <div className="trHistoryHead">
                        <span>Geçmiş (son 5 kayıt)</span>
                        <button type="button" className="trMiniTextBtn" onClick={() => setHistoryFor(null)}>
                          Kapat
                        </button>
                      </div>
                      {historyRows.length ? (
                        <ul className="trHistoryList">
                          {historyRows.map((r) => (
                            <li key={r.dateKey}>
                              <span>{r.dateKey}</span>
                              <b>{r.volumeKg ? formatKg(r.volumeKg) : '—'}</b>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="trHistoryEmpty">Bu egzersiz için geçmiş kayıt yok.</div>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })
          ) : (
            <div className="trEmpty">
              Henüz egzersiz yok. Sağ üstteki <b>+</b> ile egzersiz ekle.
            </div>
          )}
        </div>
      </div>

      <div className="trSide">
        <div className="trStoic">
          <h2>Stoik dayanıklılık</h2>
          {[
            ['Derin odak', 95],
            ['Duygusal kontrol', 82],
            ['Zorluk direnci', 88],
          ].map(([label, pct]) => (
            <div key={label} className="trMeter">
              <div className="trMeterHead">
                <span>{label}</span>
                <span className="trMeterPct">{pct}%</span>
              </div>
              <div className="trMeterBar">
                <div className="trMeterFill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
          <div className="trQuote">
            <span className="trQuoteLbl">Günlük yansıma</span>
            <p className="trQuoteText">
              “Eyleme engel olan şey, eylemi ilerletir. Yolda duran şey, yol olur.”
            </p>
          </div>
          <div className="trQuote" style={{ marginTop: 16 }}>
            <span className="trQuoteLbl">Aktif seri</span>
            <p className="trQuoteText" style={{ fontStyle: 'normal' }}>
              {streak} gün
            </p>
          </div>
        </div>

        <div className="trFocus">
          <h2>Odak oturumu</h2>
          <p className="trFocusSub">Sıfır dikkat dağıtıcı protokolü</p>
          <div className="trFocusClock">{formatMmSs(focusSec)}</div>
          <button type="button" className="trFocusBtn" onClick={onToggleTimer}>
            {running ? 'Duraklat' : focusSec === 0 ? 'Sıfırla ve başlat' : 'Protokolü başlat'}
          </button>
          <span className="material-symbols-outlined trFocusDeco">timer</span>
        </div>
      </div>
    </div>
  )
}

function SupplementsPanel({ api }) {
  const todayKey = useMemo(() => toDateKey(new Date()), [])
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('ölçek')
  const [defaultAmount, setDefaultAmount] = useState('1')
  const [dosePerUnit, setDosePerUnit] = useState('')
  const [doseUnit, setDoseUnit] = useState('g')
  const [inventory, setInventory] = useState('')

  const logsToday = api.getLogsForDay(todayKey)
  const amountBySupplement = useMemo(() => {
    const map = new Map()
    for (const r of logsToday || []) map.set(r.supplement_id, Number(r.amount) || 0)
    return map
  }, [logsToday])

  async function create(e) {
    e.preventDefault()
    await api.addSupplement({
      name,
      unit,
      default_amount: defaultAmount,
      dose_per_unit: dosePerUnit,
      dose_unit: doseUnit,
      inventory_count: inventory,
    })
    setName('')
    setDosePerUnit('')
    setInventory('')
  }

  return (
    <div className="supPage">
      <div className="supTop">
        <div>
          <h2 className="supTitle">Takviye takibi</h2>
          <p className="supSub">Bugün: {todayKey} · hızlı kayıt + stok</p>
        </div>
      </div>

      <form className="supAdd" onSubmit={create}>
        <input
          className="supInput"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Takviye adı (örn. Kreatin)"
        />
        <input
          className="supInput supSmall"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Birim (ölçek/kapsül)"
        />
        <input
          className="supInput supSmall"
          value={defaultAmount}
          onChange={(e) => setDefaultAmount(e.target.value)}
          placeholder="Varsayılan (örn. 1)"
          inputMode="decimal"
        />
        <input
          className="supInput supSmall"
          value={dosePerUnit}
          onChange={(e) => setDosePerUnit(e.target.value)}
          placeholder="1 birimde doz"
          inputMode="decimal"
        />
        <input
          className="supInput supTiny"
          value={doseUnit}
          onChange={(e) => setDoseUnit(e.target.value)}
          placeholder="g/mg/IU"
        />
        <input
          className="supInput supSmall"
          value={inventory}
          onChange={(e) => setInventory(e.target.value)}
          placeholder="Stok (örn. 60)"
          inputMode="decimal"
        />
        <button className="supBtn" type="submit" disabled={!name.trim()}>
          Ekle
        </button>
      </form>

      {api.error ? <div className="supErr">{api.error}</div> : null}

      <div className="supGrid">
        {(api.supplements || []).map((s) => {
          const cur = amountBySupplement.get(s.id) || 0
          const doseText =
            s.dose_per_unit != null && s.dose_unit ? `${s.dose_per_unit}${s.dose_unit} / ${s.unit}` : null
          return (
            <div key={s.id} className="supCard">
              <div className="supCardHead">
                <div>
                  <div className="supName">{s.name}</div>
                  <div className="supMeta">
                    Bugün: <b>{cur}</b> {s.unit}
                    {doseText ? <span> · {doseText}</span> : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="supIconBtn supDanger"
                  onClick={() => api.deleteSupplement(s.id)}
                  aria-label="Sil"
                  title="Sil"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="supQuick">
                <button
                  type="button"
                  className="supQuickBtn"
                  onClick={() => api.bumpLog({ dateKey: todayKey, supplementId: s.id, delta: 1 })}
                >
                  +1
                </button>
                <button
                  type="button"
                  className="supQuickBtn"
                  onClick={() => api.bumpLog({ dateKey: todayKey, supplementId: s.id, delta: 0.5 })}
                >
                  +0.5
                </button>
                <button
                  type="button"
                  className="supQuickBtnGhost"
                  onClick={() =>
                    api.upsertLogForDay({ dateKey: todayKey, supplementId: s.id, amount: s.default_amount || 1 })
                  }
                >
                  Varsayılan
                </button>
              </div>

              <div className="supRow">
                <span className="supRowLbl">Stok</span>
                <span className="supRowVal">{s.inventory_count == null ? '—' : `${s.inventory_count} ${s.unit}`}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="supFoot">
        <span className="supFootLbl">Streak</span>
        <div className="supStreak">
          {api.last7.map((k) => {
            const done = (api.getLogsForDay(k) || []).some((r) => Number(r.amount) > 0)
            return <span key={k} className={done ? 'supDay supDayOn' : 'supDay'} title={k} />
          })}
        </div>
      </div>
    </div>
  )
}

function NutritionPanel({ api }) {
  const [shift, setShift] = useState(0)
  const dateKey = useMemo(() => toDateKey(addDays(new Date(), -shift)), [shift])
  const [macros, setMacros] = useState(false)
  const day = api.getDay(dateKey) || {}

  return (
    <div className="nutPage">
      <div className="nutTop">
        <div>
          <h2 className="nutTitle">Kalori takibi</h2>
          <p className="nutSub">Gün: {dateKey}</p>
        </div>
        <div className="nutNav">
          <button type="button" className="nutNavBtn" onClick={() => setShift((v) => v + 1)}>
            ‹
          </button>
          <button type="button" className="nutNavBtn" onClick={() => setShift(0)}>
            Bugün
          </button>
          <button type="button" className="nutNavBtn" onClick={() => setShift((v) => Math.max(0, v - 1))} disabled={shift === 0}>
            ›
          </button>
        </div>
      </div>

      {api.error ? <div className="nutErr">{api.error}</div> : null}

      <NutritionEditor key={dateKey} api={api} dateKey={dateKey} day={day} macros={macros} setMacros={setMacros} />

      <div className="nutTrend">
        <span className="nutTrendLbl">Son 7 gün</span>
        <div className="nutBars" aria-hidden="true">
          {api.last7.map((p) => (
            <span
              key={p.dateKey}
              className="nutBar"
              title={`${p.dateKey}: ${p.calories || 0}`}
              style={{ height: `${Math.min(100, Math.round(((p.calories || 0) / 3500) * 100))}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function NutritionEditor({ api, dateKey, day, macros, setMacros }) {
  const [draft, setDraft] = useState({
    calories: day.calories ?? 0,
    protein_g: day.protein_g ?? '',
    carb_g: day.carb_g ?? '',
    fat_g: day.fat_g ?? '',
    notes: day.notes ?? '',
  })

  async function save() {
    await api.upsertDay({ dateKey, ...draft })
  }

  return (
    <div className="nutCard">
      <label className="nutLbl">
        Kalori
        <input
          className="nutInput"
          value={draft.calories}
          onChange={(e) => setDraft((p) => ({ ...p, calories: e.target.value }))}
          inputMode="numeric"
          placeholder="0"
        />
      </label>

      <label className="nutToggle">
        <input type="checkbox" checked={macros} onChange={(e) => setMacros(e.target.checked)} />
        <span>Makrolar</span>
      </label>

      {macros ? (
        <div className="nutGrid">
          <label className="nutLbl">
            Protein (g)
            <input
              className="nutInput"
              value={draft.protein_g}
              onChange={(e) => setDraft((p) => ({ ...p, protein_g: e.target.value }))}
              inputMode="numeric"
            />
          </label>
          <label className="nutLbl">
            Karb (g)
            <input
              className="nutInput"
              value={draft.carb_g}
              onChange={(e) => setDraft((p) => ({ ...p, carb_g: e.target.value }))}
              inputMode="numeric"
            />
          </label>
          <label className="nutLbl">
            Yağ (g)
            <input
              className="nutInput"
              value={draft.fat_g}
              onChange={(e) => setDraft((p) => ({ ...p, fat_g: e.target.value }))}
              inputMode="numeric"
            />
          </label>
        </div>
      ) : null}

      <label className="nutLbl">
        Not
        <textarea
          className="nutTextarea"
          value={draft.notes}
          onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Opsiyonel"
        />
      </label>

      <div className="nutActions">
        <button type="button" className="nutBtn" onClick={save}>
          Kaydet
        </button>
      </div>
    </div>
  )
}

export default function TrainingPage({ habits, supplementsApi, nutritionApi }) {
  const [mode, setMode] = useState('workout')
  const [focusSec, setFocusSec] = useState(45 * 60)
  const [running, setRunning] = useState(false)

  const streak = useMemo(() => maxStreakAcrossHabits(habits), [habits])
  const stoicScore = useMemo(() => {
    const n = habits?.length ?? 0
    if (!n) return 72
    return Math.min(98, 68 + n * 3 + Math.min(streak, 14))
  }, [habits, streak])

  const todayKey = useMemo(() => toDateKey(new Date()), [])
  const [trainingStore] = useLocalStorage('training_store_v1', { byDate: {} })
  const day = trainingStore.byDate?.[todayKey] || { exercises: [] }
  const totalVolumeKg = useMemo(() => {
    const exercises = day.exercises || []
    return exercises.reduce((sum, ex) => sum + calcExerciseVolume(ex), 0)
  }, [day.exercises])
  const totalTons = useMemo(() => {
    if (!Number.isFinite(totalVolumeKg) || totalVolumeKg <= 0) return 0
    return Math.round((totalVolumeKg / 1000) * 10) / 10
  }, [totalVolumeKg])

  useEffect(() => {
    if (!running) return undefined
    const t = setInterval(() => {
      setFocusSec((s) => {
        if (s <= 1) {
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running])

  const toggleTimer = useCallback(() => {
    if (focusSec <= 0) {
      setFocusSec(45 * 60)
      setRunning(true)
      return
    }
    setRunning((r) => !r)
  }, [focusSec])

  return (
    <div className="trPage">
      <section className="trHero">
        <div className="trHeroText">
          <h1 className="trHeroTitle">
            Antrenman &amp; <span className="trHeroAccent">odak</span>
          </h1>
          <p className="trHeroSub">Disiplini parçalara ayır: spor, takviye, kalori. Tek panel, tek ritim.</p>
        </div>
        <div className="trHeroStats">
          <div className="trHeroStat">
            <span className="trHeroStatLbl">Stoik skor</span>
            <span className="trHeroStatVal">
              {stoicScore}
              <span className="trHeroStatUnit">/100</span>
            </span>
          </div>
          <div className="trHeroStat">
            <span className="trHeroStatLbl">Hacim (bugün)</span>
            <span className="trHeroStatVal">
              {totalTons ? totalTons : '—'}
              <span className="trHeroStatUnit">t</span>
            </span>
          </div>
        </div>
      </section>

      <div className="trTabs">
        <button type="button" className={mode === 'workout' ? 'trTab trTabOn' : 'trTab'} onClick={() => setMode('workout')}>
          Spor Log
        </button>
        <button type="button" className={mode === 'supplements' ? 'trTab trTabOn' : 'trTab'} onClick={() => setMode('supplements')}>
          Takviyeler
        </button>
        <button type="button" className={mode === 'nutrition' ? 'trTab trTabOn' : 'trTab'} onClick={() => setMode('nutrition')}>
          Kalori
        </button>
      </div>

      {mode === 'workout' ? <WorkoutPanel habits={habits} focusSec={focusSec} running={running} onToggleTimer={toggleTimer} /> : null}
      {mode === 'supplements' ? (supplementsApi ? <SupplementsPanel api={supplementsApi} /> : <div className="trEmpty">Takviye verisi için oturum gerekli.</div>) : null}
      {mode === 'nutrition' ? (nutritionApi ? <NutritionPanel api={nutritionApi} /> : <div className="trEmpty">Kalori verisi için oturum gerekli.</div>) : null}

      <div className="trWide">
        <div className="trWideCard trWideGraph">
          <span className="trWideK">Hacim grafiği</span>
          <h3>
            Hipertrofi
            <br />
            ilerlemesi
          </h3>
          <div className="trBars" aria-hidden="true">
            {[25, 50, 75, 40, 60, 100, 80].map((h, i) => (
              <div key={i} className="trBar" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="trWideCard">
          <span className="trWideK">Zihinsel disiplin</span>
          <h3>
            Stoik
            <br />
            ısı haritası
          </h3>
          <div className="trMiniHeat" aria-hidden="true">
            {Array.from({ length: 21 }).map((_, i) => (
              <span key={i} className={i % 3 === 0 ? 'trMH1' : i % 2 === 0 ? 'trMH2' : 'trMH0'} />
            ))}
          </div>
        </div>
        <div className="trWideCard trWideMetrics">
          <span className="trWideK">Komuta konsolu</span>
          <h3>
            Sistem
            <br />
            metrikleri
          </h3>
          <ul className="trMetricList">
            <li>
              <span>Ort. uyku</span> <b>7s 42dk</b>
            </li>
            <li>
              <span>Protein hedefi</span> <b className="trMetricHi">185/200g</b>
            </li>
            <li>
              <span>Aktif seri</span> <b>{streak} gün</b>
            </li>
          </ul>
        </div>
      </div>

      <button type="button" className="trFab" aria-label="Yeni kayıt">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  )
}

