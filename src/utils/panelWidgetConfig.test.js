import { describe, expect, it } from 'vitest'
import {
  clampColSpan,
  clampWidgetColSpan,
  clampWidgetGridStartCol,
  DEFAULT_PANEL_ORDER,
  DEFAULT_PANEL_ROW_SPANS,
  DEFAULT_PANEL_SPANS,
  factoryPanelGridColumnStart,
  nextPanelGridWidth,
  nextPanelGridWidthForWidget,
  normalizePanelLayout,
  normalizePanelWidgets,
  panelGridSpanClass,
} from './panelWidgetConfig.js'

describe('normalizePanelLayout', () => {
  it('legacy flat map migrates to v3 with defaults', () => {
    const lay = normalizePanelLayout({ hero: true, streak: false })
    expect(lay.v).toBe(3)
    expect(lay.visibility.hero).toBe(true)
    expect(lay.visibility.streak).toBe(false)
    expect(lay.order).toEqual(DEFAULT_PANEL_ORDER)
    expect(lay.spans).toEqual(DEFAULT_PANEL_SPANS)
    expect(lay.rowSpans).toEqual(DEFAULT_PANEL_ROW_SPANS)
    expect(lay.gridColumnStart).toEqual(factoryPanelGridColumnStart())
  })

  it('v2 upgrades to v3', () => {
    const raw = {
      v: 2,
      visibility: normalizePanelWidgets({ protocols: false }),
      order: ['protocols', 'hero', 'streak', 'completion', 'heatmap'],
    }
    const lay = normalizePanelLayout(raw)
    expect(lay.v).toBe(3)
    expect(lay.order[0]).toBe('protocols')
    expect(lay.visibility.protocols).toBe(false)
    expect(lay.rowSpans.protocols).toBe(1)
  })

  it('v3 round-trip spans', () => {
    const raw = {
      v: 3,
      visibility: normalizePanelWidgets({}),
      order: DEFAULT_PANEL_ORDER,
      spans: { ...DEFAULT_PANEL_SPANS, heatmap: 6 },
    }
    const lay = normalizePanelLayout(raw)
    expect(lay.spans.heatmap).toBe(6)
    expect(lay.rowSpans.protocols).toBe(1)
  })

  it('v3 spans below per-widget minimum are clamped on load', () => {
    const lay = normalizePanelLayout({
      v: 3,
      visibility: normalizePanelWidgets({}),
      order: DEFAULT_PANEL_ORDER,
      spans: { hero: 3, streak: 2, protocols: 4, completion: 3, heatmap: 2 },
    })
    expect(lay.spans.hero).toBe(6)
    expect(lay.spans.streak).toBe(3)
    expect(lay.spans.protocols).toBe(6)
    expect(lay.spans.completion).toBe(4)
    expect(lay.spans.heatmap).toBe(4)
  })

  it('v3 kayıtta protokol 2 satır olsa bile normalize tek satıra indirir', () => {
    const lay = normalizePanelLayout({
      v: 3,
      visibility: normalizePanelWidgets({}),
      order: DEFAULT_PANEL_ORDER,
      spans: DEFAULT_PANEL_SPANS,
      rowSpans: { hero: 1, streak: 1, protocols: 2, completion: 1, heatmap: 1 },
    })
    expect(lay.rowSpans.protocols).toBe(1)
  })

  it('v3 gridColumnStart sayıları yüklenir ve clamp edilir', () => {
    const lay = normalizePanelLayout({
      v: 3,
      visibility: normalizePanelWidgets({}),
      order: DEFAULT_PANEL_ORDER,
      gridColumnStart: { heatmap: 99, hero: 2 },
      spans: { ...DEFAULT_PANEL_SPANS },
    })
    expect(lay.gridColumnStart.hero).toBe(2)
    expect(lay.gridColumnStart.heatmap).toBeLessThanOrEqual(9)
  })
})

describe('panelGridSpanClass', () => {
  it('maps widths to CSS classes', () => {
    expect(panelGridSpanClass(4)).toBe('dashBentoSpan4')
    expect(panelGridSpanClass(6)).toBe('dashBentoSpan6')
    expect(panelGridSpanClass(8)).toBe('dashBentoSpan8')
    expect(panelGridSpanClass(12)).toBe('dashBentoSpan12')
  })
})

describe('nextPanelGridWidth', () => {
  it('cycles presets including 3 (satırda 4 blok)', () => {
    expect(nextPanelGridWidth(12)).toBe(8)
    expect(nextPanelGridWidth(8)).toBe(6)
    expect(nextPanelGridWidth(6)).toBe(4)
    expect(nextPanelGridWidth(4)).toBe(3)
    expect(nextPanelGridWidth(3)).toBe(12)
  })
})

describe('nextPanelGridWidthForWidget', () => {
  it('heatmap skips 3 — min 4 sütun', () => {
    expect(nextPanelGridWidthForWidget('heatmap', 12)).toBe(8)
    expect(nextPanelGridWidthForWidget('heatmap', 8)).toBe(6)
    expect(nextPanelGridWidthForWidget('heatmap', 6)).toBe(4)
    expect(nextPanelGridWidthForWidget('heatmap', 4)).toBe(12)
  })

  it('hero yalnızca 12 — 8 — 6 arasında döner (min 6)', () => {
    expect(nextPanelGridWidthForWidget('hero', 12)).toBe(8)
    expect(nextPanelGridWidthForWidget('hero', 8)).toBe(6)
    expect(nextPanelGridWidthForWidget('hero', 6)).toBe(12)
  })
})

describe('clampWidgetColSpan', () => {
  it('enforces per-widget minimum after global clamp', () => {
    expect(clampWidgetColSpan('hero', 1)).toBe(6)
    expect(clampWidgetColSpan('heatmap', 3)).toBe(4)
    expect(clampWidgetColSpan('streak', 99)).toBe(12)
  })
})

describe('clampWidgetGridStartCol', () => {
  it('clamps to 1 .. 12-span+1', () => {
    expect(clampWidgetGridStartCol('heatmap', 4, 1)).toBe(1)
    expect(clampWidgetGridStartCol('heatmap', 4, 9)).toBe(9)
    expect(clampWidgetGridStartCol('heatmap', 4, 0)).toBe(1)
    expect(clampWidgetGridStartCol('heatmap', 4, 100)).toBe(9)
    expect(clampWidgetGridStartCol('hero', 12, 5)).toBe(1)
  })
})

describe('clampColSpan', () => {
  it('clamps arbitrary numbers', () => {
    expect(clampColSpan(0)).toBe(1)
    expect(clampColSpan(7)).toBe(7)
    expect(clampColSpan(99)).toBe(12)
  })
})
