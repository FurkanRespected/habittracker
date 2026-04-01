import { useMemo } from 'react'
import {
  buildInsightsYearHeatmap,
  estimatedDeepWorkHours,
  last7DayCompletionPercents,
  maxLongestStreakAcrossHabits,
  sparklinePathFromPercents,
  weekdayComplianceRanking,
  yearlyFocusPercent,
} from '../utils/insightsStats.js'
import { maxStreakAcrossHabits } from '../utils/dashboardUtils.js'

const HEAT_CLASS = ['insHeat0', 'insHeat1', 'insHeat2', 'insHeat3', 'insHeat4']

export default function InsightsPage({ habits }) {
  const legacyDays = useMemo(() => maxLongestStreakAcrossHabits(habits), [habits])
  const activeDays = useMemo(() => maxStreakAcrossHabits(habits), [habits])
  const yearlyPct = useMemo(() => yearlyFocusPercent(habits), [habits])
  const { cells } = useMemo(() => buildInsightsYearHeatmap(habits), [habits])
  const weekCount = Math.max(1, Math.ceil(cells.length / 7))
  const trendPts = useMemo(() => last7DayCompletionPercents(habits), [habits])
  const trendPath = useMemo(() => sparklinePathFromPercents(trendPts), [trendPts])
  const fillPath = useMemo(() => {
    if (!trendPath) return ''
    return `${trendPath} V 100 H 0 Z`
  }, [trendPath])
  const weekdayRank = useMemo(() => weekdayComplianceRanking(habits), [habits])
  const top4 = weekdayRank.slice(0, 4)
  const peak = weekdayRank[0]
  const deepHrs = useMemo(() => estimatedDeepWorkHours(habits), [habits])

  return (
    <div className="insPage">
      <div className="insBentoGrid">
        <div className="insBentoMain">
          <p className="insKicker">Miras kilometre taşı</p>
          <h2 className="insBigNum">{legacyDays} GÜN</h2>
          <p className="insBentoBody">
            Kayıtlı en uzun kesintisiz seri. Verilerinle güncellenir.
          </p>
          <div className="insBentoDecor" aria-hidden="true">
            <svg className="insDecorRing" viewBox="0 0 100 100">
              <circle
                className="insDecorTrack"
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                className="insDecorArc"
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="282.7"
                strokeDashoffset="70.6"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <span className="material-symbols-outlined insDecorIcon" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
          </div>
        </div>
        <div className="insBentoCol">
          <div className="insStatCard">
            <div>
              <p className="insStatLabel">Aktif seri</p>
              <p className="insStatVal">{activeDays} GÜN</p>
            </div>
            <span className="material-symbols-outlined insStatIco">local_fire_department</span>
          </div>
          <div className="insStatCard">
            <div>
              <p className="insStatLabel">Yıllık odak</p>
              <p className="insStatVal">{yearlyPct}%</p>
            </div>
            <span className="material-symbols-outlined insStatIco">bolt</span>
          </div>
        </div>
      </div>

      <section className="insHeatSection">
        <div className="insHeatHead">
          <div>
            <h3 className="insSectionTitle">Disiplin ısı haritası</h3>
            <p className="insSectionSub">
              Son ~12 ay — günlük protokol tamamlanma yoğunluğu
            </p>
          </div>
          <div className="insHeatLegend">
            <span>Düşük</span>
            <div className="insHeatLegendCells">
              <span className={HEAT_CLASS[0]} />
              <span className={HEAT_CLASS[1]} />
              <span className={HEAT_CLASS[2]} />
              <span className={HEAT_CLASS[3]} />
              <span className={HEAT_CLASS[4]} />
            </div>
            <span>Tepe</span>
          </div>
        </div>
        <div className="insHeatScroll">
          <div
            className="insHeatMatrix"
            style={{
              gridTemplateColumns: `22px repeat(${weekCount}, minmax(10px, 1fr))`,
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((r) => (
              <span key={`lb-${r}`} className="insHeatDowLabel" style={{ gridColumn: 1, gridRow: r + 1 }}>
                {r === 0 ? 'Pzt' : r === 2 ? 'Çar' : r === 4 ? 'Cum' : ''}
              </span>
            ))}
            {cells.map((c, i) => {
              const w = Math.floor(i / 7)
              const r = i % 7
              const cls =
                !c || c.level < 0 ? 'insHeatEmpty' : HEAT_CLASS[c.level] ?? 'insHeat0'
              return (
                <span
                  key={c?.key ?? `c-${i}`}
                  style={{ gridColumn: w + 2, gridRow: r + 1 }}
                  className={`insHeatCell ${cls}`}
                  title={c?.key ?? ''}
                />
              )
            })}
          </div>
        </div>
      </section>

      <div className="insBottomGrid">
        <div className="insTrendCard">
          <h3 className="insCardTitle">Çıktı trendi</h3>
          <div className="insChartWrap">
            <div className="insChartGrid" aria-hidden="true" />
            <svg className="insChartSvg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="insGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                </linearGradient>
              </defs>
              {fillPath ? <path d={fillPath} fill="url(#insGrad)" /> : null}
              {trendPath ? (
                <path
                  d={trendPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  className="insTrendLine"
                />
              ) : null}
            </svg>
            <div className="insChartDow">
              {['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>
          <div className="insTrendKey">
            <span className="insKeyDot" />
            <span>Birleşik performans (7 gün)</span>
          </div>
        </div>

        <div className="insPeakCard">
          <h3 className="insCardTitle">Tepe verimlilik</h3>
          <div className="insPeakList">
            {top4.map((row) => (
              <div key={row.name} className="insPeakRow">
                <div className="insPeakHead">
                  <span>{row.name}</span>
                  <span className="insPeakPct">{row.pct}% uyum</span>
                </div>
                <div className="insPeakBar">
                  <div className="insPeakFill" style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="insCommandBox">
            <p>
              <span className="insCmdWord">Komut:</span> Odak orta haftada güçlü.
              {peak ? (
                <>
                  {' '}
                  Yüksek riskli işleri <strong>{peak.name}</strong> gününe denk getirmeyi dene.
                </>
              ) : (
                ' Daha fazla veri için protokol işaretle.'
              )}
            </p>
          </div>
        </div>
      </div>

      <section className="insElite">
        <div className="insEliteBg" aria-hidden="true" />
        <div className="insEliteInner">
          <div className="insEliteBadge">Elit performans</div>
          <h4 className="insEliteTitle">Demir irade</h4>
          <p className="insEliteText">
            Son 30 günde tahmini <strong>{deepHrs}</strong> derin çalışma saati (protokol
            tutarlılığından türetildi). Disiplin grafiğin verilerinle güncellenir.
          </p>
          <button type="button" className="insEliteBtn">
            Özet oluştur
          </button>
        </div>
      </section>
    </div>
  )
}
