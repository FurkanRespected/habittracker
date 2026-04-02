import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { pickPanelGreeting } from '../utils/panelGreeting.js'

export default function DailySummaryStrip({ onOpenPanelEdit, panelEditMode }) {
  const greeting = useMemo(() => pickPanelGreeting(), [])

  return (
    <section className="dashSummaryStrip" aria-label="Günlük özet">
      <div className="dashSummaryInner">
        <p className="dashSummaryGreeting">{greeting}</p>
        <div className="dashSummaryLinks">
          <Link to="/training">Antrenman</Link>
          <Link to="/training/nutrition">Beslenme</Link>
          {onOpenPanelEdit ? (
            <button
              type="button"
              className="dashSummaryPanelEdit"
              onClick={onOpenPanelEdit}
              aria-pressed={panelEditMode}
            >
              Paneli düzenle
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
