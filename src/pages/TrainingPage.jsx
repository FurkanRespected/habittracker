import { useCallback, useEffect, useMemo, useState } from 'react'
import { maxStreakAcrossHabits } from '../utils/dashboardUtils.js'

const EXERCISES = [
  {
    n: '01',
    title: 'Barbell deadlift',
    meta: '3 set · RPE 9',
    sets: [
      { label: 'Set 1', val: '140 kg', sub: '×5' },
      { label: 'Set 2', val: '140 kg', sub: '×5' },
      { label: 'Set 3', val: '145 kg', sub: '×3', highlight: true },
    ],
    extraSlot: 'history',
  },
  {
    n: '02',
    title: 'Ağırlıklı barfiks',
    meta: '4 set · RPE 8',
    sets: [
      { label: 'Set 1', val: '20 kg', sub: '×8' },
      { label: 'Set 2', val: '20 kg', sub: '×8' },
      { label: 'Set 3', val: '20 kg', sub: '×6' },
      { label: 'Set 4', val: 'Bekliyor', sub: '', pending: true },
    ],
    extraSlot: null,
  },
]

function formatMmSs(totalSec) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TrainingPage({ habits }) {
  const streak = useMemo(() => maxStreakAcrossHabits(habits), [habits])
  const [focusSec, setFocusSec] = useState(45 * 60)
  const [running, setRunning] = useState(false)

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
            <span className="trHeroStatLbl">Hacim (demo)</span>
            <span className="trHeroStatVal">
              12.4<span className="trHeroStatUnit">t</span>
            </span>
          </div>
        </div>
      </section>

      <div className="trBento">
        <div className="trLog">
          <div className="trLogHead">
            <div>
              <h2>Günlük antrenman günlüğü</h2>
              <p className="trLogMeta">Oturum: çekiş / posterior zincir</p>
            </div>
            <button type="button" className="trLogAdd" aria-label="Ekle">
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          <div className="trExList">
            {EXERCISES.map((ex) => (
              <div key={ex.n} className="trEx">
                <div className="trExHead">
                  <div className="trExTitleRow">
                    <span className="trExNum">{ex.n}</span>
                    <h3>{ex.title}</h3>
                  </div>
                  <span className="trExMeta">{ex.meta}</span>
                </div>
                <div className="trSetGrid">
                  {ex.sets.map((s) => (
                    <div
                      key={s.label}
                      className={`trSetCell ${s.highlight ? 'trSetHi' : ''} ${s.pending ? 'trSetPending' : ''}`}
                    >
                      <div className="trSetLbl">{s.label}</div>
                      <div className="trSetVal">
                        {s.val} {s.sub ? <span className="trSetSub">{s.sub}</span> : null}
                      </div>
                    </div>
                  ))}
                  {ex.extraSlot === 'history' ? (
                    <button type="button" className="trSetHist" aria-label="Geçmiş">
                      <span className="material-symbols-outlined">history</span>
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
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
