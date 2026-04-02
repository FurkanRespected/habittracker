/** Panel widget kimlikleri — sıra, görünürlük, sütun span (12 sütunlu grid) v3. */
export const PANEL_WIDGET_IDS = ['hero', 'streak', 'protocols', 'completion', 'heatmap']

const PANEL_GRID_COLS = 12

/** Tıkla-döngü: tam → ⅔ → yarım → ⅓ → dört sütun (satırda 4 blok) → tam */
export const PANEL_GRID_WIDTHS = [12, 8, 6, 4, 3]

export const PANEL_WIDGET_LABELS = {
  hero: 'Komuta kartı',
  streak: 'Seri ve momentum',
  protocols: 'Günlük protokoller',
  completion: 'Tamamlanma özeti',
  heatmap: 'Yürütme ısı haritası',
}

export const DEFAULT_PANEL_WIDGET_VISIBILITY = Object.fromEntries(
  PANEL_WIDGET_IDS.map((id) => [id, true]),
)

export const DEFAULT_PANEL_ORDER = [...PANEL_WIDGET_IDS]

export const DEFAULT_PANEL_SPANS = {
  hero: 8,
  streak: 4,
  protocols: 8,
  completion: 4,
  heatmap: 4,
}

/** Tüm widget’lar tek grid satırı yüksekliği (eski “2 satır protokol” kaldırıldı). */
export const DEFAULT_PANEL_ROW_SPANS = Object.fromEntries(PANEL_WIDGET_IDS.map((id) => [id, 1]))

/** Elle yatay konum; null = otomatik sola paketle (yan yana sığdır). */
export function defaultPanelGridColumnStart() {
  return Object.fromEntries(PANEL_WIDGET_IDS.map((id) => [id, null]))
}

/** Fabrika / sıfırlama: ısı haritası sağ sütunda (tamamlanmanın altı). */
export function factoryPanelGridColumnStart() {
  return {
    ...defaultPanelGridColumnStart(),
    heatmap: 9,
  }
}

/** Kayıt karşılaştırma (taslak kirli mi). */
export function panelLayoutSignature(lay) {
  if (!lay || lay.v !== 3) return ''
  return JSON.stringify({
    vis: PANEL_WIDGET_IDS.map((id) => Boolean(lay.visibility[id])),
    order: lay.order,
    spans: PANEL_WIDGET_IDS.map((id) => lay.spans[id]),
    rows: PANEL_WIDGET_IDS.map((id) => lay.rowSpans[id]),
    gs: PANEL_WIDGET_IDS.map((id) => lay.gridColumnStart?.[id] ?? null),
  })
}

export function clampColSpan(span) {
  const n = Math.round(Number(span))
  if (!Number.isFinite(n)) return PANEL_GRID_COLS
  return Math.min(PANEL_GRID_COLS, Math.max(1, n))
}

/** Satırda okunaklı kalmak için widget başına minimum sütun (12’lik grid). */
export const PANEL_WIDGET_MIN_SPANS = {
  hero: 6,
  streak: 3,
  protocols: 6,
  completion: 4,
  heatmap: 4,
}

export function clampWidgetColSpan(widgetId, span) {
  const min = PANEL_WIDGET_MIN_SPANS[widgetId] ?? 1
  return Math.max(min, clampColSpan(span))
}

export function clampWidgetGridStartCol(widgetId, span, col) {
  const w = clampWidgetColSpan(widgetId, span)
  if (w >= PANEL_GRID_COLS) return 1
  const n = Math.round(Number(col))
  if (!Number.isFinite(n)) return 1
  return Math.min(PANEL_GRID_COLS - w + 1, Math.max(1, n))
}

export function nextPanelGridWidth(current) {
  const allowed = PANEL_GRID_WIDTHS
  const cur = allowed.includes(current) ? current : clampColSpan(current)
  const nearest = allowed.reduce((best, v) =>
    Math.abs(v - cur) < Math.abs(best - cur) ? v : best,
  allowed[0])
  const i = allowed.indexOf(nearest)
  return allowed[(i + 1) % allowed.length]
}

/** Önayar döngüsü — o widget’ın min genişliğinden küçük değerlere inmez. */
export function nextPanelGridWidthForWidget(widgetId, current) {
  const min = PANEL_WIDGET_MIN_SPANS[widgetId] ?? 1
  const allowed = PANEL_GRID_WIDTHS.filter((v) => v >= min)
  if (allowed.length === 0) return min
  const cur = clampWidgetColSpan(widgetId, current)
  const nearest = allowed.reduce((best, v) =>
    Math.abs(v - cur) < Math.abs(best - cur) ? v : best,
  allowed[0])
  const i = allowed.indexOf(nearest)
  return allowed[(i + 1) % allowed.length]
}

/** CSS sınıfı: dashBentoSpan4 | 6 | 8 | 12 */
export function panelGridSpanClass(span) {
  const n = Number(span)
  if (n <= 4) return 'dashBentoSpan4'
  if (n <= 6) return 'dashBentoSpan6'
  if (n <= 8) return 'dashBentoSpan8'
  return 'dashBentoSpan12'
}

export function normalizePanelWidgets(raw) {
  const out = { ...DEFAULT_PANEL_WIDGET_VISIBILITY }
  if (!raw || typeof raw !== 'object') return out
  for (const id of PANEL_WIDGET_IDS) {
    if (typeof raw[id] === 'boolean') out[id] = raw[id]
  }
  return out
}

function normalizeSpans(raw) {
  const out = { ...DEFAULT_PANEL_SPANS }
  if (!raw || typeof raw !== 'object') return out
  for (const id of PANEL_WIDGET_IDS) {
    const s = raw[id]
    if (typeof s === 'number' && Number.isFinite(s)) out[id] = clampWidgetColSpan(id, s)
  }
  return out
}

function normalizeRowSpans() {
  return { ...DEFAULT_PANEL_ROW_SPANS }
}

function normalizePanelGridStart(raw, spans) {
  const out = { ...defaultPanelGridColumnStart() }
  if (!raw || typeof raw !== 'object') return out
  for (const id of PANEL_WIDGET_IDS) {
    const c = raw[id]
    if (c === null || c === undefined) {
      out[id] = null
      continue
    }
    if (typeof c === 'number' && Number.isFinite(c)) {
      const w = spans[id] ?? 12
      out[id] = clampWidgetGridStartCol(id, w, c)
    }
  }
  return out
}

function normalizeOrderArray(order) {
  const seen = new Set()
  const out = []
  if (Array.isArray(order)) {
    for (const id of order) {
      if (PANEL_WIDGET_IDS.includes(id) && !seen.has(id)) {
        seen.add(id)
        out.push(id)
      }
    }
  }
  for (const id of PANEL_WIDGET_IDS) {
    if (!seen.has(id)) out.push(id)
  }
  return out
}

function layoutFromV2Like(visibility, order) {
  const spans = { ...DEFAULT_PANEL_SPANS }
  return {
    v: 3,
    visibility: normalizePanelWidgets(visibility),
    order: normalizeOrderArray(order),
    spans,
    rowSpans: normalizeRowSpans(),
    gridColumnStart: factoryPanelGridColumnStart(),
  }
}

/**
 * v3: { v:3, visibility, order, spans, rowSpans, gridColumnStart }
 * Eski alanlar (columnAlign, rowSpan 2) normalize sırasında yoksayılır.
 */
export function normalizePanelLayout(raw) {
  if (raw && raw.v === 3 && raw.visibility && typeof raw.visibility === 'object') {
    const sp = normalizeSpans(raw.spans)
    return {
      v: 3,
      visibility: normalizePanelWidgets(raw.visibility),
      order: normalizeOrderArray(raw.order),
      spans: sp,
      rowSpans: normalizeRowSpans(),
      gridColumnStart: normalizePanelGridStart(raw.gridColumnStart, sp),
    }
  }
  if (raw && raw.v === 2 && raw.visibility && typeof raw.visibility === 'object') {
    return layoutFromV2Like(raw.visibility, raw.order)
  }
  if (raw && typeof raw === 'object') {
    const looksLegacy = PANEL_WIDGET_IDS.some((id) => typeof raw[id] === 'boolean')
    if (looksLegacy && raw.v !== 2 && raw.v !== 3) {
      return layoutFromV2Like(raw, undefined)
    }
  }
  return {
    v: 3,
    visibility: { ...DEFAULT_PANEL_WIDGET_VISIBILITY },
    order: [...DEFAULT_PANEL_ORDER],
    spans: { ...DEFAULT_PANEL_SPANS },
    rowSpans: normalizeRowSpans(),
    gridColumnStart: factoryPanelGridColumnStart(),
  }
}

/** Görünür widget’ları koruyup fabrika düzenine çeker (ısı haritası sağ alta). */
export function mergeReferenceBentoLayout(visibility) {
  return {
    v: 3,
    visibility: normalizePanelWidgets(visibility),
    order: [...DEFAULT_PANEL_ORDER],
    spans: { ...DEFAULT_PANEL_SPANS },
    rowSpans: normalizeRowSpans(),
    gridColumnStart: factoryPanelGridColumnStart(),
  }
}
