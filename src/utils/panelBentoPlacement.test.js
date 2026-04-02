import { describe, expect, it } from 'vitest'
import {
  computePanelBentoItemStyles,
  parsePlacementGridColumnStart,
} from './panelBentoPlacement.js'
import { defaultPanelGridColumnStart } from './panelWidgetConfig.js'

describe('parsePlacementGridColumnStart', () => {
  it('gridColumn dizesinden başlangıç okur', () => {
    expect(parsePlacementGridColumnStart('5 / span 8')).toBe(5)
    expect(parsePlacementGridColumnStart('1 / span 4')).toBe(1)
  })
})

describe('computePanelBentoItemStyles', () => {
  const emptyGs = { ...defaultPanelGridColumnStart() }

  it('otomatik: 8 + 4 aynı satır (sola paketle)', () => {
    const ids = ['hero', 'streak']
    const spans = { hero: 8, streak: 4 }
    const st = computePanelBentoItemStyles(ids, spans, emptyGs)
    expect(st.hero.gridColumn).toBe('1 / span 8')
    expect(st.streak.gridColumn).toBe('9 / span 4')
    expect(st.hero.gridRow).toBe(st.streak.gridRow)
  })

  it('otomatik: protokol 8 üstte, tamamlanma 4 yanında, ısı haritası altta soldan', () => {
    const ids = ['protocols', 'completion', 'heatmap']
    const spans = { protocols: 8, completion: 4, heatmap: 4 }
    const st = computePanelBentoItemStyles(ids, spans, emptyGs)
    expect(st.protocols.gridColumn).toBe('1 / span 8')
    expect(st.completion.gridColumn).toBe('9 / span 4')
    expect(st.heatmap.gridColumn).toBe('1 / span 4')
    expect(st.heatmap.gridRow).not.toBe(st.protocols.gridRow)
  })

  it('sabit sütun: heatmap 9 ile tamamlanmanın altında sağda', () => {
    const ids = ['protocols', 'completion', 'heatmap']
    const spans = { protocols: 8, completion: 4, heatmap: 4 }
    const gs = { ...emptyGs, heatmap: 9 }
    const st = computePanelBentoItemStyles(ids, spans, gs)
    expect(st.completion.gridColumn).toBe('9 / span 4')
    expect(st.heatmap.gridColumn).toBe('9 / span 4')
    expect(st.heatmap.gridRow).not.toBe(st.completion.gridRow)
  })
})
