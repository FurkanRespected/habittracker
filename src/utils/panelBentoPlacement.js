import { clampWidgetColSpan, clampWidgetGridStartCol } from './panelWidgetConfig.js'

const COLS = 12

/** "1 / span 8" → 1 */
export function parsePlacementGridColumnStart(gridColumn) {
  if (typeof gridColumn !== 'string') return 1
  const m = gridColumn.trim().match(/^(\d+)\s*\/\s*span/i)
  return m ? Number(m[1]) : 1
}

/**
 * 12 sütunlu panel:
 * - gridColumnStart[id] sayıysa: o sütundan başlayarak ilk boş satır.
 * - değilse: satır satır, soldan sağa ilk sığan yer (doğal yan yana dizilim).
 */
export function computePanelBentoItemStyles(visibleIds, spans, gridColumnStart) {
  const occupancy = []

  const ensureRows = (throughRow) => {
    while (occupancy.length < throughRow) {
      occupancy.push(Array(COLS).fill(false))
    }
  }

  const canPlace = (row, col, w, h) => {
    if (col < 1 || col + w - 1 > COLS) return false
    ensureRows(row + h - 1)
    for (let dr = 0; dr < h; dr++) {
      for (let dc = 0; dc < w; dc++) {
        if (occupancy[row - 1 + dr][col - 1 + dc]) return false
      }
    }
    return true
  }

  const mark = (row, col, w, h) => {
    for (let dr = 0; dr < h; dr++) {
      ensureRows(row + dr)
      for (let dc = 0; dc < w; dc++) {
        occupancy[row - 1 + dr][col - 1 + dc] = true
      }
    }
  }

  const findAnchored = (anchorCol, w, h) => {
    for (let row = 1; row < 80; row++) {
      if (canPlace(row, anchorCol, w, h)) {
        mark(row, anchorCol, w, h)
        return { row, col: anchorCol }
      }
    }
    mark(1, anchorCol, w, h)
    return { row: 1, col: anchorCol }
  }

  const findFirstFitLeft = (w, h) => {
    for (let row = 1; row < 80; row++) {
      for (let col = 1; col <= COLS - w + 1; col++) {
        if (canPlace(row, col, w, h)) {
          mark(row, col, w, h)
          return { row, col }
        }
      }
    }
    mark(1, 1, w, h)
    return { row: 1, col: 1 }
  }

  const styles = {}
  const gs = gridColumnStart ?? {}

  for (const id of visibleIds) {
    const cw = clampWidgetColSpan(id, spans[id] ?? 12)
    const raw = gs[id]
    const explicit =
      typeof raw === 'number' && Number.isFinite(raw) ? clampWidgetGridStartCol(id, cw, raw) : null

    const { row, col } =
      explicit != null ? findAnchored(explicit, cw, 1) : findFirstFitLeft(cw, 1)

    styles[id] = {
      gridColumn: `${col} / span ${cw}`,
      gridRow: `${row} / span 1`,
    }
  }
  return styles
}
