import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useOutletContext } from 'react-router-dom'
import useLocalStorage from '../hooks/useLocalStorage.js'
import { maxStreakAcrossHabits, protocolStitchIcon } from '../utils/dashboardUtils.js'
import {
  addDays,
  fromDateKey,
  getLastNDays,
  getTrWeekdayShort,
  toDateKey,
  toMondayOfWeekDateKey,
} from '../utils/dateUtils.js'
import {
  INTAKE_DOW_OPTIONS,
  INTAKE_MODE,
  buildIntakeScheduleDbFields,
  normalizeCustomDays,
} from '../utils/supplementIntakeScheduleUtils.js'

function startOfCalendarDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function weekStripCanShiftNext(stripEndDate) {
  const nextEnd = addDays(stripEndDate, 7)
  return startOfCalendarDay(nextEnd) <= startOfCalendarDay(new Date())
}

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

function findLastBestWeightForName(trainingStore, focusDayKey, exerciseName) {
  const name = String(exerciseName || '').trim().toLowerCase()
  if (!name) return null
  const all = trainingStore?.byDate || {}
  const keys = Object.keys(all)
    .filter((k) => k < focusDayKey)
    .sort()
    .reverse()
  for (const k of keys) {
    const exs = all[k]?.exercises || []
    const match = exs.find((e) => String(e.name || '').trim().toLowerCase() === name)
    if (!match) continue
    let best = 0
    for (const s of match.sets || []) {
      const w = Number(String(s.weightKg || '').replace(',', '.'))
      if (Number.isFinite(w) && w > best) best = w
    }
    if (best > 0) return { dateKey: k, weightKg: best }
  }
  return null
}

export function WorkoutPanel({ habits, focusSec, running, onToggleTimer }) {
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
  const [focusDayKey, setFocusDayKey] = useState(() => toDateKey(new Date()))
  const [trainingStore, setTrainingStore] = useLocalStorage('training_store_v1', { byDate: {} })
  const [tplStore, setTplStore] = useLocalStorage('workout_templates_v1', { templates: [] })
  const [tplPick, setTplPick] = useState('')
  const day = trainingStore.byDate?.[focusDayKey] || { exercises: [] }
  const exercises = useMemo(() => day.exercises || [], [day.exercises])
  const [historyFor, setHistoryFor] = useState(null)
  const templates = tplStore?.templates || []

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
        const cur = byDate[focusDayKey] || { exercises: [] }
        const nextDay = typeof updater === 'function' ? updater(cur) : updater
        byDate[focusDayKey] = nextDay
        return { ...(prev || {}), byDate }
      })
    },
    [setTrainingStore, focusDayKey],
  )

  const seedDefaultTemplates = useCallback(() => {
    setTplStore({
      templates: [
        {
          id: newId(),
          name: 'İtme',
          exercises: [{ name: 'Bench press' }, { name: 'Omuz press' }, { name: 'Triceps' }],
        },
        {
          id: newId(),
          name: 'Çekme',
          exercises: [{ name: 'Barfiks / lat' }, { name: 'Row' }, { name: 'Biceps' }],
        },
        {
          id: newId(),
          name: 'Bacak',
          exercises: [{ name: 'Squat' }, { name: 'RDL' }, { name: 'Leg curl' }],
        },
      ],
    })
  }, [setTplStore])

  const applyTemplate = useCallback(() => {
    const t = templates.find((x) => x.id === tplPick)
    if (!t?.exercises?.length) return
    setDay((cur) => {
      const list = [...(cur.exercises || [])]
      let seq = list.length
      for (const row of t.exercises) {
        seq += 1
        list.push({
          id: newId(),
          n: String(seq).padStart(2, '0'),
          name: row.name || '',
          rpe: '',
          sets: [{ weightKg: '', reps: '' }],
        })
      }
      const renum = list.map((e, idx) => ({ ...e, n: String(idx + 1).padStart(2, '0') }))
      return { ...cur, exercises: renum }
    })
  }, [templates, tplPick, setDay])

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
    const keys = Object.keys(all).filter((k) => k !== focusDayKey).sort().reverse()
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
  }, [historyFor, focusDayKey, trainingStore.byDate])

  return (
    <div className="trBento">
      <div className="trLog">
        <div className="trLogHead">
          <div>
            <h2>Günlük antrenman günlüğü</h2>
            <p className="trLogMeta">
              Kayıt günü: {focusDayKey} · hacim: {totalTons ? totalTons : '—'}t
            </p>
            <div className="trLogToolbar">
              <label className="trDateLbl">
                Tarih
                <input
                  type="date"
                  className="trDateInput"
                  value={focusDayKey}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v) setFocusDayKey(v)
                  }}
                />
              </label>
              <div className="trTplRow">
                <select
                  className="trTplSelect"
                  value={tplPick}
                  onChange={(e) => setTplPick(e.target.value)}
                  aria-label="Antrenman şablonu"
                >
                  <option value="">Şablon seç</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button type="button" className="trTplBtn" onClick={applyTemplate}>
                  Şablondan ekle
                </button>
                {templates.length === 0 ? (
                  <button type="button" className="trTplBtn trTplBtnGhost" onClick={seedDefaultTemplates}>
                    Varsayılan şablonlar
                  </button>
                ) : null}
              </div>
            </div>
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
                        {(() => {
                          const hint = findLastBestWeightForName(trainingStore, focusDayKey, ex.name)
                          return hint ? (
                            <p className="trExHint">
                              Önceki kayıt: <strong>{formatKg(hint.weightKg)}</strong> ({hint.dateKey})
                            </p>
                          ) : null
                        })()}
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

/** 1–4 hazır seçenek; aksi halde "Diğer" + serbest değer */
function splitDefaultAmountForPicker(raw) {
  const n = Number(raw)
  if (Number.isFinite(n) && n >= 1 && n <= 4 && Math.floor(n) === n) {
    return { choice: String(Math.trunc(n)), other: '' }
  }
  return { choice: 'other', other: raw != null && raw !== '' ? String(raw) : '' }
}

function resolvedDefaultAmountFromPicker(choice, otherStr) {
  if (choice === 'other') {
    const x = Number(String(otherStr).replace(',', '.').trim())
    return Number.isFinite(x) && x > 0 ? x : 1
  }
  const n = Number(choice)
  return Number.isFinite(n) && n > 0 ? n : 1
}

function SupDefaultAmountSelect({
  choice,
  onChoice,
  other,
  onOther,
  idPrefix = 'sup-amt',
  layout = 'stacked',
}) {
  const row = (
    <div className={layout === 'inline' ? 'supAmtSelectRow supAmtSelectRowInline' : 'supAmtSelectRow'}>
      <select
        id={`${idPrefix}-sel`}
        className="supInput supSmall"
        value={choice}
        onChange={(e) => onChoice(e.target.value)}
        aria-label="Varsayılan günlük miktar"
        title="Varsayılan günlük miktar"
      >
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="other">Diğer…</option>
      </select>
      {choice === 'other' ? (
        <input
          className="supInput supSmall supAmtOtherInput"
          value={other}
          onChange={(e) => onOther(e.target.value)}
          placeholder="Örn. 5"
          inputMode="decimal"
          aria-label="Özel miktar"
        />
      ) : null}
    </div>
  )

  if (layout === 'inline') {
    return <div className="supAmtBlockInline">{row}</div>
  }

  return (
    <div className="supAmtBlock supAmtBlockSelect">
      <label className="supAmtPickLbl" htmlFor={`${idPrefix}-sel`}>
        Varsayılan günlük miktar
      </label>
      {row}
    </div>
  )
}

function SupplementIntakeScheduleFields({
  enabled,
  onEnabled,
  mode,
  onMode,
  weeklyDay,
  onWeeklyDay,
  customDays,
  onCustomDays,
  intervalAnchor,
  onIntervalAnchor,
  idPrefix,
}) {
  const prevModeRef = useRef(mode)

  function toggleDay(v) {
    const set = new Set(customDays)
    if (set.has(v)) set.delete(v)
    else set.add(v)
    onCustomDays([...set].sort((a, b) => a - b))
  }

  const needsAnchor = mode === INTAKE_MODE.EVERY_2_DAYS || mode === INTAKE_MODE.EVERY_3_DAYS

  useEffect(() => {
    if (!enabled) {
      prevModeRef.current = mode
      return
    }
    const nowNeeds = mode === INTAKE_MODE.EVERY_2_DAYS || mode === INTAKE_MODE.EVERY_3_DAYS
    const prevNeeds =
      prevModeRef.current === INTAKE_MODE.EVERY_2_DAYS ||
      prevModeRef.current === INTAKE_MODE.EVERY_3_DAYS
    if (nowNeeds && !prevNeeds) {
      onIntervalAnchor(toMondayOfWeekDateKey(new Date()))
    }
    prevModeRef.current = mode
  }, [enabled, mode, onIntervalAnchor])

  return (
    <>
      <label className="supInvToggle">
        <input type="checkbox" checked={enabled} onChange={(e) => onEnabled(e.target.checked)} />
        <span>Alış sıklığı</span>
      </label>
      {enabled ? (
        <div className="supIntakeBlock">
          <p className="supInvNote supIntakeLead">
            Sadece kayıt — takvimde otomatik kısıt yok. İleride hatırlatıcı bununla bağlanabilir.
          </p>
          <label className="supDetailLbl" htmlFor={`${idPrefix}-mode`}>
            Sıklık
          </label>
          <select
            id={`${idPrefix}-mode`}
            className="supInput supSmall"
            value={mode}
            onChange={(e) => onMode(e.target.value)}
          >
            <option value={INTAKE_MODE.DAILY}>Her gün</option>
            <option value={INTAKE_MODE.WEEKDAYS}>Sadece hafta içi</option>
            <option value={INTAKE_MODE.WEEKENDS}>Sadece haftasonu</option>
            <option value={INTAKE_MODE.WEEKLY}>Haftada bir</option>
            <option value={INTAKE_MODE.EVERY_2_DAYS}>2 günde bir</option>
            <option value={INTAKE_MODE.EVERY_3_DAYS}>3 günde bir</option>
            <option value={INTAKE_MODE.CUSTOM_DAYS}>Haftanın seçili günleri</option>
          </select>
          {needsAnchor ? (
            <>
              <label className="supDetailLbl" htmlFor={`${idPrefix}-anchor`}>
                Başlangıç (varsayılan bu haftanın pazartesi)
              </label>
              <input
                id={`${idPrefix}-anchor`}
                type="date"
                className="supInput supSmall"
                value={intervalAnchor}
                onChange={(e) => onIntervalAnchor(e.target.value)}
              />
              <p className="supInvNote">
                Başlangıç pazartesi ise: 2 günde bir sırayla Pazartesi — Çarşamba — Cuma — Pazar; 3 günde
                bir sırayla Pazartesi — Perşembe — Pazar — Çarşamba… Periyot, seçtiğin tarihten itibaren +2 /
                +3 gün mantığıyla devam eder; farklı bir desen istersen başlangıç tarihini kaydır.
              </p>
            </>
          ) : null}
          {mode === INTAKE_MODE.WEEKLY ? (
            <>
              <label className="supDetailLbl" htmlFor={`${idPrefix}-wday`}>
                Haftanın günü
              </label>
              <select
                id={`${idPrefix}-wday`}
                className="supInput supSmall"
                value={weeklyDay}
                onChange={(e) => onWeeklyDay(Number(e.target.value))}
              >
                {INTAKE_DOW_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          {mode === INTAKE_MODE.CUSTOM_DAYS ? (
            <div className="supIntakeDowRow" role="group" aria-label="Alınan günler">
              {INTAKE_DOW_OPTIONS.map(({ value, label }) => {
                const on = customDays.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    className={`supIntakeDowBtn ${on ? 'isOn' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggleDay(value)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

function supplementTemplateInitial(s) {
  const presets = ['ölçek/servis', 'kapsül/tablet']
  const unitChoice = presets.includes(s.unit) ? s.unit : '__custom__'
  const unitCustom = presets.includes(s.unit) ? '' : s.unit || ''
  const hasDose = s.dose_per_unit != null && s.dose_unit
  const du = s.dose_unit
  let doseUnitChoice = 'g'
  let doseUnitCustom = ''
  if (du === 'g' || du === 'ml') {
    doseUnitChoice = du
  } else if (du) {
    doseUnitChoice = '__custom__'
    doseUnitCustom = du
  }
  const invOn = s.inventory_amount != null && s.inventory_unit
  const iu = s.inventory_unit
  let inventoryUnitChoice = 'g'
  let inventoryUnitCustom = ''
  if (iu === 'g' || iu === 'ml' || iu === 'adet') {
    inventoryUnitChoice = iu
  } else if (iu) {
    inventoryUnitChoice = '__custom__'
    inventoryUnitCustom = iu
  }
  const da = splitDefaultAmountForPicker(s.default_amount ?? 1)
  const intakeModeSource = s.intake_mode ?? s.reminder_mode
  const intakeMode =
    intakeModeSource && Object.values(INTAKE_MODE).includes(intakeModeSource)
      ? intakeModeSource
      : INTAKE_MODE.DAILY
  let intakeWeeklyDay = 1
  const wd = Number(s.intake_weekly_day ?? s.reminder_weekly_day)
  if (Number.isFinite(wd)) intakeWeeklyDay = ((Math.trunc(wd) % 7) + 7) % 7
  const intakeCustomSource = s.intake_custom_days ?? s.reminder_custom_days
  const intakeAnchorSource = s.intake_interval_anchor ?? s.reminder_interval_anchor
  const intakeIntervalAnchor =
    intakeAnchorSource != null
      ? String(intakeAnchorSource).slice(0, 10)
      : toMondayOfWeekDateKey(new Date())

  return {
    name: s.name,
    unitChoice,
    unitCustom,
    defaultAmtChoice: da.choice,
    defaultAmtOther: da.other,
    doseEnabled: hasDose,
    dosePerUnit: hasDose ? String(s.dose_per_unit) : '',
    doseUnitChoice,
    doseUnitCustom,
    inventoryEnabled: Boolean(invOn),
    inventoryAmount: invOn ? String(s.inventory_amount) : '',
    inventoryUnitChoice,
    inventoryUnitCustom,
    intakeEnabled: Boolean(s.intake_enabled ?? s.reminder_enabled),
    intakeMode,
    intakeWeeklyDay,
    intakeCustomDays: normalizeCustomDays(intakeCustomSource),
    intakeIntervalAnchor,
  }
}

function SupplementTemplateEditor({ s, api, onClose, embedded = false }) {
  const init = supplementTemplateInitial(s)
  const [name, setName] = useState(init.name)
  const [unitChoice, setUnitChoice] = useState(init.unitChoice)
  const [unitCustom, setUnitCustom] = useState(init.unitCustom)
  const [defaultAmtChoice, setDefaultAmtChoice] = useState(init.defaultAmtChoice)
  const [defaultAmtOther, setDefaultAmtOther] = useState(init.defaultAmtOther)
  const [doseEnabled, setDoseEnabled] = useState(init.doseEnabled)
  const [dosePerUnit, setDosePerUnit] = useState(init.dosePerUnit)
  const [doseUnitChoice, setDoseUnitChoice] = useState(init.doseUnitChoice)
  const [doseUnitCustom, setDoseUnitCustom] = useState(init.doseUnitCustom)
  const [inventoryEnabled, setInventoryEnabled] = useState(init.inventoryEnabled)
  const [inventoryAmount, setInventoryAmount] = useState(init.inventoryAmount)
  const [inventoryUnitChoice, setInventoryUnitChoice] = useState(init.inventoryUnitChoice)
  const [inventoryUnitCustom, setInventoryUnitCustom] = useState(init.inventoryUnitCustom)
  const [intakeEnabled, setIntakeEnabled] = useState(init.intakeEnabled)
  const [intakeMode, setIntakeMode] = useState(init.intakeMode)
  const [intakeWeeklyDay, setIntakeWeeklyDay] = useState(init.intakeWeeklyDay)
  const [intakeCustomDays, setIntakeCustomDays] = useState(init.intakeCustomDays)
  const [intakeIntervalAnchor, setIntakeIntervalAnchor] = useState(init.intakeIntervalAnchor)

  async function save(e) {
    e.preventDefault()
    if (
      intakeEnabled &&
      intakeMode === INTAKE_MODE.CUSTOM_DAYS &&
      normalizeCustomDays(intakeCustomDays).length === 0
    ) {
      window.alert('Haftanın seçili günleri için en az bir gün seç.')
      return
    }
    const resolvedUnit = unitChoice === '__custom__' ? unitCustom.trim() : unitChoice
    const resolvedDoseUnit = doseUnitChoice === '__custom__' ? doseUnitCustom.trim() : doseUnitChoice
    const resolvedInventoryUnit =
      inventoryUnitChoice === '__custom__' ? inventoryUnitCustom.trim() : inventoryUnitChoice
    const intakePatch = buildIntakeScheduleDbFields({
      enabled: intakeEnabled,
      mode: intakeMode,
      weeklyDay: intakeWeeklyDay,
      customDays: intakeCustomDays,
      intervalAnchor:
        intakeMode === INTAKE_MODE.EVERY_2_DAYS || intakeMode === INTAKE_MODE.EVERY_3_DAYS
          ? intakeIntervalAnchor || undefined
          : undefined,
    })
    await api.updateSupplement(s.id, {
      name: name.trim(),
      unit: resolvedUnit || 'ölçek/servis',
      default_amount: resolvedDefaultAmountFromPicker(defaultAmtChoice, defaultAmtOther),
      dose_per_unit:
        doseEnabled && dosePerUnit !== '' && dosePerUnit != null ? Number(dosePerUnit) : null,
      dose_unit: doseEnabled ? resolvedDoseUnit || null : null,
      inventory_amount: inventoryEnabled && inventoryAmount !== '' ? Number(inventoryAmount) : null,
      inventory_unit: inventoryEnabled ? resolvedInventoryUnit || null : null,
      ...intakePatch,
    })
    onClose?.()
  }

  return (
    <form className="supTplForm" onSubmit={save}>
      <p className="supTplK">Şablon (sonraki günler)</p>
      <input className="supInput" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad" />
      <div className="supTplRow">
        <select
          className="supInput supSmall"
          value={unitChoice}
          onChange={(e) => setUnitChoice(e.target.value)}
          aria-label="Birim"
        >
          <option value="ölçek/servis">Ölçek / Servis</option>
          <option value="kapsül/tablet">Kapsül / Tablet</option>
          <option value="__custom__">Diğer…</option>
        </select>
        {unitChoice === '__custom__' ? (
          <input
            className="supInput supSmall"
            value={unitCustom}
            onChange={(e) => setUnitCustom(e.target.value)}
            placeholder="Birim"
          />
        ) : null}
      </div>
      <SupDefaultAmountSelect
        choice={defaultAmtChoice}
        onChoice={setDefaultAmtChoice}
        other={defaultAmtOther}
        onOther={setDefaultAmtOther}
        idPrefix={`tpl-amt-${s.id}`}
      />
      <label className="supInvToggle">
        <input type="checkbox" checked={doseEnabled} onChange={(e) => setDoseEnabled(e.target.checked)} />
        <span>Doz</span>
      </label>
      {doseEnabled ? (
        <div className="supTplRow">
          <input
            className="supInput supSmall"
            value={dosePerUnit}
            onChange={(e) => setDosePerUnit(e.target.value)}
            placeholder="1 birimde doz"
            inputMode="decimal"
          />
          <select
            className="supInput supTiny"
            value={doseUnitChoice}
            onChange={(e) => setDoseUnitChoice(e.target.value)}
            aria-label="Doz birimi"
          >
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="__custom__">Diğer…</option>
          </select>
          {doseUnitChoice === '__custom__' ? (
            <input
              className="supInput supTiny"
              value={doseUnitCustom}
              onChange={(e) => setDoseUnitCustom(e.target.value)}
              placeholder="örn. mg"
            />
          ) : null}
        </div>
      ) : null}
      <label className="supInvToggle">
        <input
          type="checkbox"
          checked={inventoryEnabled}
          onChange={(e) => setInventoryEnabled(e.target.checked)}
        />
        <span>Stok</span>
      </label>
      {inventoryEnabled ? (
        <div className="supInvStockBlock">
          <div className="supInvStockInputs">
            <input
              className="supInput supSmall supInvStockAmt"
              value={inventoryAmount}
              onChange={(e) => setInventoryAmount(e.target.value)}
              placeholder="Miktar"
              inputMode="decimal"
            />
            <button
              type="button"
              className="supInvInfoBtn"
              title="Listede gördüğün kalan miktar = buraya yazdığın toplam − tiklediğin günlerin tüketimi."
              aria-label="Stok: listede kalan miktar, yazdığın toplamdan tiklenen günlerin tüketimi düşülerek hesaplanır."
            >
              <span className="material-symbols-outlined">info</span>
            </button>
            <select
              className="supInput supTiny supInvStockUnit"
              value={inventoryUnitChoice}
              onChange={(e) => setInventoryUnitChoice(e.target.value)}
              aria-label="Stok birimi"
            >
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="adet">adet</option>
              <option value="__custom__">Diğer…</option>
            </select>
            {inventoryUnitChoice === '__custom__' ? (
              <input
                className="supInput supTiny supInvStockCustom"
                value={inventoryUnitCustom}
                onChange={(e) => setInventoryUnitCustom(e.target.value)}
                placeholder="örn. mg, servis"
              />
            ) : null}
          </div>
          <p className="supInvNote">
            Listede görünen kalan = yazdığın toplam − tiklenen günlerin tüketimi.
          </p>
        </div>
      ) : null}
      <SupplementIntakeScheduleFields
        enabled={intakeEnabled}
        onEnabled={setIntakeEnabled}
        mode={intakeMode}
        onMode={setIntakeMode}
        weeklyDay={intakeWeeklyDay}
        onWeeklyDay={setIntakeWeeklyDay}
        customDays={intakeCustomDays}
        onCustomDays={setIntakeCustomDays}
        intervalAnchor={intakeIntervalAnchor}
        onIntervalAnchor={setIntakeIntervalAnchor}
        idPrefix={`tpl-intake-${s.id}`}
      />
      <div className="supTplActions">
        {!embedded ? (
          <button type="button" className="supTplBtnGhost" onClick={onClose}>
            Vazgeç
          </button>
        ) : null}
        <button type="submit" className="supBtn" disabled={!name.trim()}>
          {embedded ? 'Şablonu kaydet' : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}

function SupplementDetailPanel({ s, selectedDateKey, api, onClose, onDelete }) {
  if (!s) return null

  if (s.archived) {
    return (
      <div className="supDetailWrap">
        <button type="button" className="supDetailBackdrop" aria-label="Kapat" onClick={onClose} />
        <div className="supDetailSheet" role="dialog" aria-modal="true" aria-labelledby="supDetailTitle">
          <div className="supDetailHead">
            <h3 id="supDetailTitle" className="supDetailTitle">
              {s.name}
            </h3>
            <button type="button" className="supDetailClose" onClick={onClose} aria-label="Kapat">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <p className="supDetailSub">Arşivde — aktif listede görünmez.</p>
          <div className="supDetailArchive">
            <button
              type="button"
              className="supBtn"
              onClick={async () => {
                await api.updateSupplement(s.id, { archived: false })
                onClose()
              }}
            >
              Listeye geri al
            </button>
          </div>
          <div className="supDetailDangerZone">
            <button
              type="button"
              className="supTplBtnGhost supDangerText"
              onClick={() => {
                const ok = window.confirm(`“${s.name}” tamamen silinsin mi?`)
                if (!ok) return
                onDelete?.(s.id)
                onClose()
              }}
            >
              Takviyeyi sil
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SupplementDetailPanelActive
      s={s}
      selectedDateKey={selectedDateKey}
      api={api}
      onClose={onClose}
      onDelete={onDelete}
    />
  )
}

function SupplementDetailPanelActive({ s, selectedDateKey, api, onClose, onDelete }) {
  const [focusDayKey, setFocusDayKey] = useState(selectedDateKey)
  const [stripEndDate, setStripEndDate] = useState(() => fromDateKey(selectedDateKey))
  const [dayAmtInput, setDayAmtInput] = useState('1')
  const saveBtnRef = useRef(null)
  const resetBtnRef = useRef(null)

  function ackButtonPress(btnRef) {
    try {
      navigator.vibrate?.(12)
    } catch {
      /* yok say */
    }
    const el = btnRef.current
    if (!el) return
    el.classList.remove('supDetailActionAck')
    void el.offsetWidth
    el.classList.add('supDetailActionAck')
    const onEnd = () => {
      el.classList.remove('supDetailActionAck')
      el.removeEventListener('animationend', onEnd)
    }
    el.addEventListener('animationend', onEnd)
  }

  useEffect(() => {
    setFocusDayKey(selectedDateKey)
    setStripEndDate(fromDateKey(selectedDateKey))
  }, [selectedDateKey, s.id])

  const detailWeek = useMemo(() => getLastNDays(7, stripEndDate), [stripEndDate])
  const canShiftWeekNext = weekStripCanShiftNext(stripEndDate)

  useEffect(() => {
    const keys = new Set(detailWeek.map((d) => d.key))
    if (!keys.has(focusDayKey)) {
      setFocusDayKey(detailWeek[detailWeek.length - 1].key)
    }
  }, [detailWeek, focusDayKey])

  const wd = getTrWeekdayShort(fromDateKey(focusDayKey))
  const logs = api.getLogsForDay(focusDayKey)
  const logRow = logs.find((r) => r.supplement_id === s.id)
  const tpl = Number(s.default_amount) || 1
  const eff = logRow ? Number(logRow.amount) || 0 : tpl
  const doseText =
    s.dose_per_unit != null && s.dose_unit ? `${s.dose_per_unit}${s.dose_unit} / ${s.unit}` : null

  /** Yalnızca gün / takviye / şablon varsayılanı değişince inputu senkronla (Kaydet sonrası sıfırlanmasın). */
  useEffect(() => {
    const dayLogs = api.getLogsForDay(focusDayKey)
    const row = dayLogs.find((r) => r.supplement_id === s.id && r.time == null)
    const t = Number(s.default_amount) || 1
    const nextEff = row ? Number(row.amount) || 0 : t
    setDayAmtInput(String(nextEff))
  }, [focusDayKey, s.id, s.default_amount])

  /** Kaydet: şablondaki ile aynı olsa da bu gün için satır yazar. */
  async function commitDayAmount() {
    const n = Number(String(dayAmtInput).replace(',', '.').trim())
    if (!Number.isFinite(n) || n < 0) {
      setDayAmtInput(String(eff))
      return
    }
    const sameAsPersisted = logRow && Number(logRow.amount) === n
    if (sameAsPersisted) {
      ackButtonPress(saveBtnRef)
      return
    }

    try {
      await api.upsertLogForDay({ dateKey: focusDayKey, supplementId: s.id, amount: n })
      ackButtonPress(saveBtnRef)
    } catch (err) {
      window.alert(err?.message || 'Kaydedilemedi.')
      setDayAmtInput(String(eff))
    }
  }

  async function markArchived() {
    const ok = window.confirm('Bu takviyi arşive taşıyalım mı? (İstersen sonra geri alabilirsin.)')
    if (!ok) return
    await api.updateSupplement(s.id, { archived: true })
    onClose()
  }

  return (
    <div className="supDetailWrap">
      <button type="button" className="supDetailBackdrop" aria-label="Kapat" onClick={onClose} />
      <div className="supDetailSheet" role="dialog" aria-modal="true" aria-labelledby="supDetailTitle">
        <div className="supDetailHead">
          <h3 id="supDetailTitle" className="supDetailTitle">
            {s.name}
          </h3>
          <button type="button" className="supDetailClose" onClick={onClose} aria-label="Kapat">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="supDetailSub">
          Seçili gün: {wd} · {focusDayKey}
          {doseText ? <span className="supDetailDose"> · {doseText}</span> : null}
        </p>

        <div className="supDetailWeekStrip" role="group" aria-label="Hafta — geçmişe git">
          <button
            type="button"
            className="supDetailWeekNavBtn"
            aria-label="Önceki haftaya git"
            onClick={() => setStripEndDate((d) => addDays(d, -7))}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="protocolStitchWeek supDetailWeek" role="tablist" aria-label="Gün seç">
            {detailWeek.map(({ key, date }) => {
              const active = key === focusDayKey
              const short = getTrWeekdayShort(date)
              const dayHasLog = api
                .getLogsForDay(key)
                .some((r) => r.supplement_id === s.id && r.time == null)
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`protocolStitchDay supDetailDayPick ${dayHasLog ? 'supDetailDayHasLog' : ''} ${active ? 'isToday' : ''}`}
                  onClick={() => setFocusDayKey(key)}
                >
                  <span className="protocolStitchDayDow">{short}</span>
                  <span className="protocolStitchDayDom">{key.slice(8)}</span>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            className="supDetailWeekNavBtn"
            aria-label="Sonraki haftaya git"
            disabled={!canShiftWeekNext}
            onClick={() => setStripEndDate((d) => addDays(d, 7))}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <label className="supDetailLbl">Bu gün alınan miktar ({s.unit})</label>
        <input
          className="supDayAmtInput supDetailDayAmtInput"
          value={dayAmtInput}
          onChange={(e) => setDayAmtInput(e.target.value)}
          inputMode="decimal"
          aria-describedby={`sup-day-hint-${s.id}`}
        />
        <p className="supDetailHint" id={`sup-day-hint-${s.id}`}>
          Yukarıdan günü seç; miktarı yazdıktan sonra yalnızca Kaydet ile sunucuya yazılır. Kaydet,
          şablondaki ile aynı olsa da bu günü kayda geçirir. Turuncu vurgulu günlerde bu takviye için
          kayıt vardır.
        </p>

        <div className="supDetailActions">
          <button
            ref={resetBtnRef}
            type="button"
            className="supTplBtnGhost supDetailActionBtn"
            onClick={() => {
              void (async () => {
                try {
                  await api.deleteLogForDay({ dateKey: focusDayKey, supplementId: s.id })
                  const t = Number(s.default_amount) || 1
                  setDayAmtInput(String(t))
                  ackButtonPress(resetBtnRef)
                } catch (err) {
                  window.alert(err?.message || 'Güncellenemedi.')
                }
              })()
            }}
          >
            Varsayılana dön
          </button>
          <button
            ref={saveBtnRef}
            type="button"
            className="supBtn supBtnSmall supDetailSaveAmt supDetailActionBtn"
            onClick={() => void commitDayAmount()}
          >
            Kaydet
          </button>
        </div>

        <div className="supDetailDivider" />

        <SupplementTemplateEditor key={`${s.id}-${s.updated_at}`} s={s} api={api} embedded />

        <div className="supDetailDivider" />

        <div className="supDetailArchive">
          <button type="button" className="supBtn supBtnGhost" onClick={markArchived}>
            Takviye bitti → arşiv
          </button>
        </div>

        <div className="supDetailDangerZone">
          <button
            type="button"
            className="supTplBtnGhost supDangerText"
            onClick={() => {
              const ok = window.confirm(`“${s.name}” tamamen silinsin mi?`)
              if (!ok) return
              onDelete?.(s.id)
              onClose()
            }}
          >
            Takviyeyi sil
          </button>
        </div>
      </div>
    </div>
  )
}

function SupplementAddSheet({ api, open, onClose }) {
  const [name, setName] = useState('')
  const [unitChoice, setUnitChoice] = useState('ölçek/servis')
  const [unitCustom, setUnitCustom] = useState('')
  const [defaultAmtChoice, setDefaultAmtChoice] = useState('1')
  const [defaultAmtOther, setDefaultAmtOther] = useState('')
  const [doseEnabled, setDoseEnabled] = useState(false)
  const [dosePerUnit, setDosePerUnit] = useState('')
  const [doseUnitChoice, setDoseUnitChoice] = useState('g')
  const [doseUnitCustom, setDoseUnitCustom] = useState('')
  const [inventoryEnabled, setInventoryEnabled] = useState(false)
  const [inventoryAmount, setInventoryAmount] = useState('')
  const [inventoryUnitChoice, setInventoryUnitChoice] = useState('g')
  const [inventoryUnitCustom, setInventoryUnitCustom] = useState('')
  const [intakeEnabled, setIntakeEnabled] = useState(false)
  const [intakeMode, setIntakeMode] = useState(INTAKE_MODE.DAILY)
  const [intakeWeeklyDay, setIntakeWeeklyDay] = useState(1)
  const [intakeCustomDays, setIntakeCustomDays] = useState([])
  const [intakeIntervalAnchor, setIntakeIntervalAnchor] = useState(() => toMondayOfWeekDateKey(new Date()))

  useEffect(() => {
    if (!open) return
    setName('')
    setUnitChoice('ölçek/servis')
    setUnitCustom('')
    setDefaultAmtChoice('1')
    setDefaultAmtOther('')
    setDoseEnabled(false)
    setDosePerUnit('')
    setDoseUnitChoice('g')
    setDoseUnitCustom('')
    setInventoryEnabled(false)
    setInventoryAmount('')
    setInventoryUnitChoice('g')
    setInventoryUnitCustom('')
    setIntakeEnabled(false)
    setIntakeMode(INTAKE_MODE.DAILY)
    setIntakeWeeklyDay(1)
    setIntakeCustomDays([])
    setIntakeIntervalAnchor(toMondayOfWeekDateKey(new Date()))
  }, [open])

  if (!open) return null

  async function submit(e) {
    e.preventDefault()
    if (
      intakeEnabled &&
      intakeMode === INTAKE_MODE.CUSTOM_DAYS &&
      normalizeCustomDays(intakeCustomDays).length === 0
    ) {
      window.alert('Haftanın seçili günleri için en az bir gün seç.')
      return
    }
    const resolvedUnit = unitChoice === '__custom__' ? unitCustom.trim() : unitChoice
    const resolvedDoseUnit = doseUnitChoice === '__custom__' ? doseUnitCustom.trim() : doseUnitChoice
    const resolvedInventoryUnit =
      inventoryUnitChoice === '__custom__' ? inventoryUnitCustom.trim() : inventoryUnitChoice
    const intakePatch = buildIntakeScheduleDbFields({
      enabled: intakeEnabled,
      mode: intakeMode,
      weeklyDay: intakeWeeklyDay,
      customDays: intakeCustomDays,
      intervalAnchor:
        intakeMode === INTAKE_MODE.EVERY_2_DAYS || intakeMode === INTAKE_MODE.EVERY_3_DAYS
          ? intakeIntervalAnchor || undefined
          : undefined,
    })
    try {
      await api.addSupplement({
        name,
        unit: resolvedUnit || 'ölçek/servis',
        default_amount: resolvedDefaultAmountFromPicker(defaultAmtChoice, defaultAmtOther),
        dose_per_unit: doseEnabled ? dosePerUnit : null,
        dose_unit: doseEnabled ? resolvedDoseUnit || null : null,
        inventory_amount: inventoryEnabled ? inventoryAmount : null,
        inventory_unit: inventoryEnabled ? resolvedInventoryUnit || null : null,
        ...intakePatch,
      })
      onClose()
    } catch (err) {
      window.alert(err?.message || 'Takviye eklenemedi.')
    }
  }

  return (
    <div className="supDetailWrap">
      <button type="button" className="supDetailBackdrop" aria-label="Kapat" onClick={onClose} />
      <div className="supDetailSheet" role="dialog" aria-modal="true" aria-labelledby="supAddTitle">
        <div className="supDetailHead">
          <h3 id="supAddTitle" className="supDetailTitle">
            Yeni takviye
          </h3>
          <button type="button" className="supDetailClose" onClick={onClose} aria-label="Kapat">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="supDetailSub">Düzenle paneliyle aynı alanlar — kaydettikten sonra listede görünür.</p>

        <form className="supAddSheetForm" onSubmit={submit}>
          <input
            className="supInput"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Takviye adı (örn. Kreatin)"
          />
          <select
            className="supInput supSmall"
            value={unitChoice}
            onChange={(e) => setUnitChoice(e.target.value)}
            aria-label="Birim"
          >
            <option value="ölçek/servis">Ölçek / Servis</option>
            <option value="kapsül/tablet">Kapsül / Tablet</option>
            <option value="__custom__">Diğer…</option>
          </select>
          {unitChoice === '__custom__' ? (
            <input
              className="supInput supSmall"
              value={unitCustom}
              onChange={(e) => setUnitCustom(e.target.value)}
              placeholder="Birim (örn. shot, damla)"
            />
          ) : null}
          <SupDefaultAmountSelect
            choice={defaultAmtChoice}
            onChoice={setDefaultAmtChoice}
            other={defaultAmtOther}
            onOther={setDefaultAmtOther}
            idPrefix="sup-sheet-amt"
          />
          <label className="supInvToggle supInvToggleSheet">
            <input type="checkbox" checked={doseEnabled} onChange={(e) => setDoseEnabled(e.target.checked)} />
            <span>Doz</span>
          </label>
          {doseEnabled ? (
            <>
              <div className="supAddSheetPair">
                <input
                  className="supInput supSmall"
                  value={dosePerUnit}
                  onChange={(e) => setDosePerUnit(e.target.value)}
                  placeholder="1 birimde doz (örn. 5)"
                  inputMode="decimal"
                />
                <select
                  className="supInput supTiny"
                  value={doseUnitChoice}
                  onChange={(e) => setDoseUnitChoice(e.target.value)}
                  aria-label="Doz birimi"
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="__custom__">Diğer…</option>
                </select>
              </div>
              {doseUnitChoice === '__custom__' ? (
                <input
                  className="supInput supTiny"
                  value={doseUnitCustom}
                  onChange={(e) => setDoseUnitCustom(e.target.value)}
                  placeholder="Doz birimi (örn. mg)"
                />
              ) : null}
            </>
          ) : null}
          <label className="supInvToggle supInvToggleSheet">
            <input
              type="checkbox"
              checked={inventoryEnabled}
              onChange={(e) => setInventoryEnabled(e.target.checked)}
            />
            <span>Stok</span>
          </label>
          {inventoryEnabled ? (
            <div className="supInvStockBlock">
              <div className="supInvStockInputs supInvStockInputsSheet">
                <input
                  className="supInput supSmall supInvStockAmt"
                  value={inventoryAmount}
                  onChange={(e) => setInventoryAmount(e.target.value)}
                  placeholder="Miktar (örn. 300)"
                  inputMode="decimal"
                />
                <button
                  type="button"
                  className="supInvInfoBtn"
                  title="Listede görünen kalan = yazdığın toplam − tiklediğin günler."
                  aria-label="Stok: kalan miktar, toplam stoktan tiklenen günler düşülerek hesaplanır."
                >
                  <span className="material-symbols-outlined">info</span>
                </button>
                <select
                  className="supInput supTiny supInvStockUnit"
                  value={inventoryUnitChoice}
                  onChange={(e) => setInventoryUnitChoice(e.target.value)}
                  aria-label="Stok birimi"
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="adet">adet</option>
                  <option value="__custom__">Diğer…</option>
                </select>
                {inventoryUnitChoice === '__custom__' ? (
                  <input
                    className="supInput supTiny supInvStockCustom"
                    value={inventoryUnitCustom}
                    onChange={(e) => setInventoryUnitCustom(e.target.value)}
                    placeholder="Stok birimi (örn. mg, servis)"
                  />
                ) : null}
              </div>
              <p className="supInvNote">
                Listede görünen kalan = yazdığın toplam − tiklenen günler.
              </p>
            </div>
          ) : null}

          <SupplementIntakeScheduleFields
            enabled={intakeEnabled}
            onEnabled={setIntakeEnabled}
            mode={intakeMode}
            onMode={setIntakeMode}
            weeklyDay={intakeWeeklyDay}
            onWeeklyDay={setIntakeWeeklyDay}
            customDays={intakeCustomDays}
            onCustomDays={setIntakeCustomDays}
            intervalAnchor={intakeIntervalAnchor}
            onIntervalAnchor={setIntakeIntervalAnchor}
            idPrefix="sup-sheet-intake"
          />

          <div className="supAddSheetFooter">
            <button type="button" className="supTplBtnGhost" onClick={onClose}>
              İptal
            </button>
            <button className="supBtn" type="submit" disabled={!name.trim()}>
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function SupplementsPanel({ api }) {
  const todayKey = toDateKey(new Date())
  const weekDays = useMemo(() => getLastNDays(7, new Date()), [todayKey])
  const [addOpen, setAddOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const { activeSupplements, archivedSupplements } = useMemo(() => {
    const all = api.supplements || []
    const active = []
    const archived = []
    for (const row of all) {
      if (row.archived) archived.push(row)
      else active.push(row)
    }
    return { activeSupplements: active, archivedSupplements: archived }
  }, [api.supplements])

  const detailSup = useMemo(
    () => (detailId ? (api.supplements || []).find((x) => x.id === detailId) ?? null : null),
    [api.supplements, detailId],
  )

  const logsForDay = api.getLogsForDay(todayKey)
  const logBySupplement = useMemo(() => {
    const map = new Map()
    for (const r of logsForDay || []) map.set(r.supplement_id, r)
    return map
  }, [logsForDay])

  const supplementDoneByDay = useMemo(() => {
    const m = new Map()
    for (const { key } of weekDays) {
      for (const r of api.getLogsForDay(key)) {
        if (!m.has(r.supplement_id)) m.set(r.supplement_id, new Set())
        m.get(r.supplement_id).add(key)
      }
    }
    return m
  }, [weekDays, api.logsByDay])

  function effectiveAmount(s) {
    const row = logBySupplement.get(s.id)
    if (row) return Number(row.amount) || 0
    return Number(s.default_amount) || 1
  }

  function hasLogForDay(s) {
    return Boolean(logBySupplement.get(s.id))
  }

  async function toggleDayLog(s) {
    try {
      if (hasLogForDay(s)) {
        await api.deleteLogForDay({ dateKey: todayKey, supplementId: s.id })
      } else {
        await api.upsertLogForDay({
          dateKey: todayKey,
          supplementId: s.id,
          amount: Number(s.default_amount) || 1,
        })
      }
    } catch (err) {
      window.alert(err?.message || 'Kayıt güncellenemedi.')
    }
  }

  async function toggleDayLogForDate(s, dateKey) {
    try {
      const logs = api.getLogsForDay(dateKey)
      const row = logs.find((r) => r.supplement_id === s.id)
      if (row) {
        await api.deleteLogForDay({ dateKey, supplementId: s.id })
      } else {
        await api.upsertLogForDay({
          dateKey,
          supplementId: s.id,
          amount: Number(s.default_amount) || 1,
        })
      }
    } catch (err) {
      window.alert(err?.message || 'Kayıt güncellenemedi.')
    }
  }

  function openAddSheet() {
    setDetailId(null)
    setAddOpen(true)
  }

  return (
    <div className="supPage">
      <div className="supTop supTopWithAct">
        <h2 className="supTitle">Takviye takibi</h2>
        <button type="button" className="supFabAdd" onClick={openAddSheet} aria-label="Takviye ekle">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {api.loading ? <div className="supMuted">Yükleniyor…</div> : null}

      {api.error ? <div className="supErr">{api.error}</div> : null}

      <div className="supHabitList">
        {activeSupplements.map((s) => {
          const on = hasLogForDay(s)
          const eff = effectiveAmount(s)
          const tpl = Number(s.default_amount) || 1
          const iconName = protocolStitchIcon(s.id)
          const doneDays = supplementDoneByDay.get(s.id) ?? new Set()
          const rem = api.getInventoryRemaining(s)
          const stock =
            rem == null || !s.inventory_unit
              ? null
              : `${rem} ${s.inventory_unit}`
          return (
            <article key={s.id} className={`protocolStitch ${on ? 'protocolStitchDone' : ''}`}>
              <div className="protocolStitchMain">
                <div className="protocolStitchLeft">
                  <div className={`protocolStitchIcon ${on ? 'isProtocolDone' : ''}`} aria-hidden="true">
                    <span
                      className="material-symbols-outlined protocolStitchIconSym"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {iconName}
                    </span>
                  </div>
                  <div className="protocolStitchInfo">
                    <button
                      type="button"
                      className="protocolStitchTitle supProtoTitleBtn"
                      onClick={() => {
                        setAddOpen(false)
                        setDetailId(s.id)
                      }}
                    >
                      {s.name}
                    </button>
                    <p className="protocolStitchMeta">
                      {on ? (
                        <>
                          Bu gün <span className="supMetaAmt">{eff}</span> {s.unit}
                          {Number(eff) !== tpl ? ` · şablon ${tpl}` : ''}
                        </>
                      ) : (
                        <>
                          Şablon <span className="supMetaAmt">{tpl}</span> {s.unit}
                        </>
                      )}
                      {stock ? ` · stok ${stock}` : ''}
                    </p>
                  </div>
                </div>
                <div className="protocolStitchRight">
                  <div className="protocolStitchTools">
                    <button
                      type="button"
                      className="protocolStitchTool"
                      onClick={() => {
                        setAddOpen(false)
                        setDetailId(s.id)
                      }}
                      title="Düzenle — isim, stok, şablon, gün bazlı miktar"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    className={`protocolStitchCheck ${on ? 'isOn' : ''}`}
                    onClick={() => toggleDayLog(s)}
                    aria-label={on ? 'Bugünkü işareti kaldır' : 'Bugün alındı işaretle'}
                  >
                    {on ? (
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        done_all
                      </span>
                    ) : (
                      <span className="material-symbols-outlined">check</span>
                    )}
                  </button>
                </div>
              </div>
              <div className="protocolStitchWeek" role="group" aria-label="Hafta — gün gün işaretle">
                {weekDays.map(({ key: dKey, date }) => {
                  const checked = doneDays.has(dKey)
                  const isStripToday = dKey === todayKey
                  return (
                    <button
                      key={`${s.id}-${dKey}`}
                      type="button"
                      className={`protocolStitchDay supWeekDayBtn ${checked ? 'isOn' : ''} ${isStripToday ? 'isToday' : ''}`}
                      title={dKey}
                      aria-pressed={checked}
                      onClick={() => void toggleDayLogForDate(s, dKey)}
                    >
                      <span className="protocolStitchDayDow">{getTrWeekdayShort(date)}</span>
                      <span className="protocolStitchDayDom">{date.getDate()}</span>
                    </button>
                  )
                })}
              </div>
            </article>
          )
        })}
      </div>

      {activeSupplements.length === 0 && !api.loading ? (
        <p className="supMuted">
          {archivedSupplements.length
            ? 'Aktif takviye yok. Arşivden geri alabilir veya sağ üstteki + ile ekleyebilirsin.'
            : 'Henüz takviye yok. Sağ üstteki + ile ekleyebilirsin.'}
        </p>
      ) : null}

      {archivedSupplements.length ? (
        <div className="supArchiveBlock">
          <p className="supArchiveHeading">Arşiv</p>
          <ul className="supArchiveList">
            {archivedSupplements.map((s) => (
              <li key={s.id} className="supArchiveRow">
                <span className="supArchiveName">{s.name}</span>
                <div className="supArchiveActions">
                  <button
                    type="button"
                    className="supTplBtnGhost"
                    onClick={() => api.updateSupplement(s.id, { archived: false })}
                  >
                    Geri al
                  </button>
                  <button
                    type="button"
                    className="supTplBtnGhost"
                    onClick={() => {
                      setAddOpen(false)
                      setDetailId(s.id)
                    }}
                  >
                    Detay
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <SupplementAddSheet api={api} open={addOpen} onClose={() => setAddOpen(false)} />

      {detailSup ? (
        <SupplementDetailPanel
          s={detailSup}
          selectedDateKey={todayKey}
          api={api}
          onClose={() => setDetailId(null)}
          onDelete={(id) => api.deleteSupplement(id)}
        />
      ) : null}
    </div>
  )
}

export function NutritionPanel({ api }) {
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

function trTabClass({ isActive }) {
  return `trTab${isActive ? ' trTabOn' : ''}`
}

export function TrainingOverviewOutlet() {
  return (
    <div className="trHubGrid">
      <NavLink to="/training/log" className="trHubCard">
        <span className="material-symbols-outlined trHubCardIco" aria-hidden="true">
          fitness_center
        </span>
        <span className="trHubCardK">Spor</span>
        <h3 className="trHubCardTitle">Antrenman günlüğü</h3>
        <p className="trHubCardSub">Set, tekrar, hacim ve odak zamanlayıcı</p>
      </NavLink>
      <NavLink to="/training/supplements" className="trHubCard">
        <span className="material-symbols-outlined trHubCardIco" aria-hidden="true">
          medication
        </span>
        <span className="trHubCardK">Takviye</span>
        <h3 className="trHubCardTitle">Takviye takibi</h3>
        <p className="trHubCardSub">Günlük doz ve envanter (bulut oturumu)</p>
      </NavLink>
      <NavLink to="/training/nutrition" className="trHubCard">
        <span className="material-symbols-outlined trHubCardIco" aria-hidden="true">
          restaurant
        </span>
        <span className="trHubCardK">Beslenme</span>
        <h3 className="trHubCardTitle">Kalori ve makrolar</h3>
        <p className="trHubCardSub">Günlük kayıt ve özet (bulut oturumu)</p>
      </NavLink>
    </div>
  )
}

export function TrainingLogOutlet() {
  const { habits, focusSec, running, toggleTimer } = useOutletContext()
  return <WorkoutPanel habits={habits} focusSec={focusSec} running={running} onToggleTimer={toggleTimer} />
}

export function TrainingSupplementsOutlet() {
  const { supplementsApi } = useOutletContext()
  return supplementsApi ? (
    <SupplementsPanel api={supplementsApi} />
  ) : (
    <div className="trEmpty">Takviye verisi için oturum gerekli.</div>
  )
}

export function TrainingNutritionOutlet() {
  const { nutritionApi } = useOutletContext()
  return nutritionApi ? (
    <NutritionPanel api={nutritionApi} />
  ) : (
    <div className="trEmpty">Kalori verisi için oturum gerekli.</div>
  )
}

export default function TrainingPage({ habits, supplementsApi, nutritionApi }) {
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

  const volumeSeries7 = useMemo(() => {
    const dates = getLastNDays(7, new Date())
    const byDate = trainingStore.byDate || {}
    return dates.map(({ key }) => {
      const ex = byDate[key]?.exercises || []
      return ex.reduce((s, e) => s + calcExerciseVolume(e), 0)
    })
  }, [trainingStore])
  const maxVolBar = Math.max(...volumeSeries7, 1)

  const disciplineHeat21 = useMemo(() => {
    const keys = getLastNDays(21, new Date())
      .map((d) => d.key)
      .reverse()
    const n = habits?.length || 0
    if (!n) return keys.map(() => 0)
    return keys.map((key) => {
      let c = 0
      for (const h of habits) {
        if (h.history?.[key]) c++
      }
      return c / n
    })
  }, [habits])

  const todayNutrition = nutritionApi?.getDay?.(todayKey) ?? null

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

  const outletContext = useMemo(
    () => ({
      habits,
      focusSec,
      running,
      toggleTimer,
      supplementsApi,
      nutritionApi,
    }),
    [habits, focusSec, running, toggleTimer, supplementsApi, nutritionApi],
  )

  return (
    <div className="trPage">
      <section className="trHero">
        <div className="trHeroText">
          <h1 className="trHeroTitle">
            Antrenman &amp; <span className="trHeroAccent">odak</span>
          </h1>
          <p className="trHeroSub">Özet burada; detaylar için alt rotalar. Spor, takviye, kalori ayrı URL’lerde.</p>
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

      <div className="trTabs" role="navigation" aria-label="Antrenman bölümleri">
        <NavLink to="/training" end className={trTabClass}>
          Özet
        </NavLink>
        <NavLink to="/training/log" className={trTabClass}>
          Spor log
        </NavLink>
        <NavLink to="/training/supplements" className={trTabClass}>
          Takviyeler
        </NavLink>
        <NavLink to="/training/nutrition" className={trTabClass}>
          Kalori
        </NavLink>
      </div>

      <Outlet context={outletContext} />

      <div className="trWide">
        <div className="trWideCard trWideGraph">
          <span className="trWideK">Hacim (son 7 gün)</span>
          <h3>
            Yerel
            <br />
            günlük
          </h3>
          <div className="trBars" aria-hidden="true">
            {volumeSeries7.map((vol, i) => (
              <div
                key={i}
                className="trBar"
                style={{ height: `${Math.round((vol / maxVolBar) * 100)}%` }}
              />
            ))}
          </div>
        </div>
        <div className="trWideCard">
          <span className="trWideK">Protokol disiplini</span>
          <h3>
            Son 21
            <br />
            gün
          </h3>
          <div className="trMiniHeat" aria-hidden="true">
            {disciplineHeat21.map((pct, i) => {
              const c =
                pct >= 0.85 ? 'trMH1' : pct >= 0.5 ? 'trMH2' : pct > 0 ? 'trMH0' : 'trMH0'
              return <span key={i} className={c} />
            })}
          </div>
        </div>
        <div className="trWideCard trWideMetrics">
          <span className="trWideK">Özet</span>
          <h3>
            Bugün &
            <br />
            hesap
          </h3>
          <ul className="trMetricList">
            <li>
              <span>Aktif seri</span> <b>{streak} gün</b>
            </li>
            <li>
              <span>Protokol sayısı</span> <b>{habits?.length ?? 0}</b>
            </li>
            <li>
              <span>Bugün kalori</span>{' '}
              <b className="trMetricHi">
                {todayNutrition && Number.isFinite(Number(todayNutrition.calories))
                  ? `${Math.round(Number(todayNutrition.calories))} kcal`
                  : '—'}
              </b>
            </li>
            <li>
              <span>Protein (bugün)</span>{' '}
              <b>
                {todayNutrition?.protein_g != null && todayNutrition.protein_g !== ''
                  ? `${todayNutrition.protein_g} g`
                  : '—'}
              </b>
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

