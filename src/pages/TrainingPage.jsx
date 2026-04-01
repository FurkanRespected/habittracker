import { useCallback, useEffect, useMemo, useState } from 'react'
import useLocalStorage from '../hooks/useLocalStorage.js'
import { maxStreakAcrossHabits } from '../utils/dashboardUtils.js'
import { toDateKey } from '../utils/dateUtils.js'

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function makeExercise(seq) {
  return {
    id: newId(),
    n: String(seq).padStart(2, '0'),
    name: '',
    rpe: '',
    sets: [{ weightKg: '', reps: '' }],
  }
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

function formatMmSs(totalSec) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TrainingPage({ habits }) {
  const streak = useMemo(() => maxStreakAcrossHabits(habits), [habits])
  const todayKey = useMemo(() => toDateKey(new Date()), [])
  const [trainingStore, setTrainingStore] = useLocalStorage('training_store_v1', {
    byDate: {},
  })
  const day = trainingStore.byDate?.[todayKey] || { exercises: [] }
  const exercises = useMemo(() => day.exercises || [], [day.exercises])

  const [focusSec, setFocusSec] = useState(45 * 60)
  const [running, setRunning] = useState(false)
  const [historyFor, setHistoryFor] = useState(null)

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

  const startProtocol = useCallback(() => {
    if (focusSec <= 0) {
      setFocusSec(45 * 60)
      setRunning(true)
      return
    }
    setRunning((r) => !r)
  }, [focusSec])

  const stoicScore = useMemo(() => {
    const n = habits?.length ?? 0
    if (!n) return 72
    return Math.min(98, 68 + n * 3 + Math.min(streak, 14))
  }, [habits, streak])

  const totalVolumeKg = useMemo(() => {
    return exercises.reduce((sum, ex) => sum + calcExerciseVolume(ex), 0)
  }, [exercises])

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
    <div className="trPage">
      <section className="trHero">
        <div className="trHeroText">
          <h1 className="trHeroTitle">
            Antrenman &amp; <span className="trHeroAccent">odak</span>
          </h1>
          <p className="trHeroSub">
            Fiziksel çıktı ve zihinsel dayanıklılığı aynı panelde tut. (Demo içerik — veri bağlanabilir.)
          </p>
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

      <div className="trBento">
        <div className="trLog">
          <div className="trLogHead">
            <div>
              <h2>Günlük antrenman günlüğü</h2>
              <p className="trLogMeta">Oturum: bugünün setleri · kayıt: {todayKey}</p>
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
                    <div key={`${ex.id}-${idx}`} className={`trSetCell ${idx === (ex.sets?.length || 1) - 1 ? 'trSetHi' : ''}`}>
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
                  <button type="button" className="trSetHist" onClick={() => addSet(ex.id)} aria-label="Set ekle" title="Set ekle">
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
          </div>

          <div className="trFocus">
            <h2>Odak oturumu</h2>
            <p className="trFocusSub">Sıfır dikkat dağıtıcı protokolü</p>
            <div className="trFocusClock">{formatMmSs(focusSec)}</div>
            <button type="button" className="trFocusBtn" onClick={startProtocol}>
              {running ? 'Duraklat' : focusSec === 0 ? 'Sıfırla ve başlat' : 'Protokolü başlat'}
            </button>
            <span className="material-symbols-outlined trFocusDeco">timer</span>
          </div>
        </div>
      </div>

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
