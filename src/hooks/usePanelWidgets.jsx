import { createContext, useCallback, useContext, useMemo } from 'react'
import useLocalStorage from './useLocalStorage.js'
import {
  clampWidgetColSpan,
  clampWidgetGridStartCol,
  normalizePanelLayout,
  nextPanelGridWidthForWidget,
  PANEL_WIDGET_IDS,
} from '../utils/panelWidgetConfig.js'

const STORAGE_KEY = 'habitracker-panel-widgets-v1'

const PanelWidgetsContext = createContext(null)

function spreadPersistBase(lay) {
  return {
    v: 3,
    visibility: lay.visibility,
    order: lay.order,
    spans: lay.spans,
    rowSpans: lay.rowSpans,
    gridColumnStart: lay.gridColumnStart,
  }
}

/** Görünür yapılırken sırayı sonda birleştir (eski indeks yerine en sona eklenir). */
function orderWithWidgetAppended(order, id) {
  const rest = order.filter((x) => x !== id)
  return [...rest, id]
}

export function PanelWidgetsProvider({ children }) {
  const [raw, setRaw] = useLocalStorage(STORAGE_KEY, {})

  const layout = useMemo(() => normalizePanelLayout(raw), [raw])
  const visibility = layout.visibility
  const order = layout.order
  const spans = layout.spans
  const rowSpans = layout.rowSpans
  const gridColumnStart = layout.gridColumnStart

  const persist = useCallback(
    (updater) => {
      setRaw((prev) => {
        const lay = normalizePanelLayout(prev)
        return updater(lay)
      })
    },
    [setRaw],
  )

  const commitPanelLayout = useCallback((lay) => {
    const n = normalizePanelLayout({
      v: 3,
      visibility: lay.visibility,
      order: lay.order,
      spans: lay.spans,
      rowSpans: lay.rowSpans,
      gridColumnStart: lay.gridColumnStart,
    })
    setRaw(n)
  }, [setRaw])

  const setWidget = useCallback(
    (id, nextVisible) => {
      if (!PANEL_WIDGET_IDS.includes(id)) return
      persist((lay) => {
        const vis = Boolean(nextVisible)
        const nextOrder = vis ? orderWithWidgetAppended(lay.order, id) : lay.order
        return {
          ...spreadPersistBase(lay),
          visibility: { ...lay.visibility, [id]: vis },
          order: nextOrder,
        }
      })
    },
    [persist],
  )

  const setOrder = useCallback(
    (nextOrder) => {
      persist((lay) => {
        const seen = new Set()
        const merged = []
        for (const id of nextOrder) {
          if (PANEL_WIDGET_IDS.includes(id) && !seen.has(id)) {
            seen.add(id)
            merged.push(id)
          }
        }
        for (const id of lay.order) {
          if (!seen.has(id)) merged.push(id)
        }
        return {
          ...spreadPersistBase(lay),
          order: merged,
        }
      })
    },
    [persist],
  )

  const setWidgetSpan = useCallback(
    (id, span) => {
      if (!PANEL_WIDGET_IDS.includes(id)) return
      const n = clampWidgetColSpan(id, span)
      persist((lay) => {
        const nextGs = { ...lay.gridColumnStart }
        const prevStart = nextGs[id]
        if (typeof prevStart === 'number' && Number.isFinite(prevStart)) {
          nextGs[id] = clampWidgetGridStartCol(id, n, prevStart)
        }
        return {
          ...spreadPersistBase(lay),
          spans: { ...lay.spans, [id]: n },
          gridColumnStart: nextGs,
        }
      })
    },
    [persist],
  )

  const toggleWidgetSpan = useCallback(
    (id) => {
      if (!PANEL_WIDGET_IDS.includes(id)) return
      persist((lay) => {
        const cur = lay.spans[id] ?? 12
        const n = nextPanelGridWidthForWidget(id, cur)
        const nextGs = { ...lay.gridColumnStart }
        const prevStart = nextGs[id]
        if (typeof prevStart === 'number' && Number.isFinite(prevStart)) {
          nextGs[id] = clampWidgetGridStartCol(id, n, prevStart)
        }
        return {
          ...spreadPersistBase(lay),
          spans: { ...lay.spans, [id]: n },
          gridColumnStart: nextGs,
        }
      })
    },
    [persist],
  )

  const setWidgetGridStart = useCallback(
    (id, columnStartOrNull) => {
      if (!PANEL_WIDGET_IDS.includes(id)) return
      persist((lay) => {
        const w = lay.spans[id] ?? 12
        const nextGs = { ...lay.gridColumnStart }
        if (columnStartOrNull == null) {
          nextGs[id] = null
        } else {
          nextGs[id] = clampWidgetGridStartCol(id, w, columnStartOrNull)
        }
        return {
          ...spreadPersistBase(lay),
          gridColumnStart: nextGs,
        }
      })
    },
    [persist],
  )

  const resetToDefaults = useCallback(() => {
    setRaw({})
  }, [setRaw])

  const value = useMemo(
    () => ({
      layout,
      visibility,
      order,
      spans,
      rowSpans,
      gridColumnStart,
      commitPanelLayout,
      setWidget,
      setOrder,
      setWidgetSpan,
      toggleWidgetSpan,
      setWidgetGridStart,
      resetToDefaults,
    }),
    [
      layout,
      visibility,
      order,
      spans,
      rowSpans,
      gridColumnStart,
      commitPanelLayout,
      setWidget,
      setOrder,
      setWidgetSpan,
      toggleWidgetSpan,
      setWidgetGridStart,
      resetToDefaults,
    ],
  )

  return <PanelWidgetsContext.Provider value={value}>{children}</PanelWidgetsContext.Provider>
}

export default function usePanelWidgets() {
  const ctx = useContext(PanelWidgetsContext)
  if (!ctx) {
    throw new Error('usePanelWidgets yalnızca PanelWidgetsProvider içinde kullanılmalıdır.')
  }
  return ctx
}
