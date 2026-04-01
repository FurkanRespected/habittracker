import { buildMergedHeatmap, todayCompletionStats } from '../utils/dashboardUtils.js'
import { toDateKey } from '../utils/dateUtils.js'

const R = 88
const CIRC = 2 * Math.PI * R

export function ProtocolCompletionCard({ habits }) {
  const todayKey = toDateKey(new Date())
  const { done, total, pct } = todayCompletionStats(habits, todayKey)
  const dashOffset = total ? CIRC * (1 - pct / 100) : CIRC

  return (
    <div className="dashCard dashCardPad">
      <h3 className="dashCardTitle">Protokol tamamlanma</h3>
      <div className="dashSvgRingWrap">
        <svg className="dashSvgRingSvg" viewBox="0 0 192 192" aria-hidden="true">
          <g transform="rotate(-90 96 96)">
            <circle
              cx="96"
              cy="96"
              r={R}
              fill="transparent"
              stroke="rgba(15, 23, 42, 0.95)"
              strokeWidth="4"
            />
            <circle
              cx="96"
              cy="96"
              r={R}
              fill="transparent"
              stroke="#d97706"
              strokeWidth="8"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
            />
          </g>
        </svg>
        <div className="dashSvgRingLabel">
          <span>{total ? `${pct}%` : '—'}</span>
          <span>bugün</span>
        </div>
      </div>
      <p className="dashMilestone">
        {total ? (
          <>
            <strong>
              {done}/{total}
            </strong>{' '}
            tamamlandı
          </>
        ) : (
          'Henüz protokol yok'
        )}
      </p>
      <div className="dashProtoBarTrack">
        <div className="dashProtoBarFill" style={{ width: `${total ? pct : 0}%` }} />
      </div>
    </div>
  )
}

export function ExecutionHeatmapCard({ habits }) {
  const cells = buildMergedHeatmap(habits, 14)

  return (
    <div className="dashCard dashCardPad">
      <div className="dashHeatmapHead">
        <h3 className="dashCardTitle dashHeatTitle">Yürütme geçmişi</h3>
        <div className="dashHeatmapLegend">
          <span>Düşük</span>
          <div className="dashLegendCells">
            <span className="heatL0" />
            <span className="heatL1" />
            <span className="heatL2" />
            <span className="heatL3" />
            <span className="heatL4" />
          </div>
          <span>Yüksek</span>
        </div>
      </div>
      <div
        className="dashHeatmapGrid dashHeatmapGrid7"
        role="img"
        aria-label="Son haftalar birleşik aktivite"
      >
        {cells.map((c) => (
          <span key={c.key} className={`heatCell heatL${c.level}`} title={c.key} />
        ))}
      </div>
      <div className="dashHeatmapFoot">
        <span>Döngü başı</span>
        <span>Bugün</span>
      </div>
    </div>
  )
}
