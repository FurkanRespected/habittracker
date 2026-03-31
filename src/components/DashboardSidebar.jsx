import { buildMergedHeatmap, todayCompletionStats } from '../utils/dashboardUtils.js'
import { toDateKey } from '../utils/dateUtils.js'

export function ProtocolCompletionCard({ habits }) {
  const todayKey = toDateKey(new Date())
  const { done, total, pct } = todayCompletionStats(habits, todayKey)

  return (
    <div className="dashCard dashCardPad">
      <h3 className="dashCardTitle">Protokol tamamlanma</h3>
      <div className="dashRingWrap" style={{ '--ring-pct': pct }}>
        <div className="dashRing">
          <div className="dashRingHole">
            <span className="dashRingPct">{total ? `${pct}%` : '—'}</span>
            <span className="dashRingSub">bugün</span>
          </div>
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
    </div>
  )
}

export function ExecutionHeatmapCard({ habits }) {
  const cells = buildMergedHeatmap(habits, 56)

  return (
    <div className="dashCard dashCardPad">
      <div className="dashHeatmapHead">
        <h3 className="dashCardTitle">Yürütme geçmişi</h3>
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
      <div className="dashHeatmapGrid" role="img" aria-label="Son haftalar birleşik aktivite">
        {cells.map((c) => (
          <span key={c.key} className={`heatCell heatL${c.level}`} title={c.key} />
        ))}
      </div>
      <div className="dashHeatmapFoot">
        <span>Başlangıç</span>
        <span>Bugün</span>
      </div>
    </div>
  )
}
