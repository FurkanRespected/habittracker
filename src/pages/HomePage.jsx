import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AddHabit from '../components/AddHabit.jsx'
import DailySummaryStrip from '../components/DailySummaryStrip.jsx'
import { ExecutionHeatmapCard, ProtocolCompletionCard } from '../components/DashboardSidebar.jsx'
import HabitList from '../components/HabitList.jsx'
import PanelSpanGlyph from '../components/PanelSpanGlyph.jsx'
import usePanelWidgets from '../hooks/usePanelWidgets.jsx'
import {
  computePanelBentoItemStyles,
  parsePlacementGridColumnStart,
} from '../utils/panelBentoPlacement.js'
import {
  PANEL_WIDGET_IDS,
  PANEL_WIDGET_LABELS,
  clampWidgetColSpan,
  clampWidgetGridStartCol,
  DEFAULT_PANEL_WIDGET_VISIBILITY,
  mergeReferenceBentoLayout,
  nextPanelGridWidthForWidget,
  normalizePanelLayout,
  panelLayoutSignature,
} from '../utils/panelWidgetConfig.js'
import { todayCompletionStats } from '../utils/dashboardUtils.js'
import { toDateKey } from '../utils/dateUtils.js'

const PREVIEW_LIMIT = 4

const FOCUS_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBBA174Qis_JT2iVKGvxxId1H9-T1A7Sb6L30fd8zEHGiXGaTp3wMk5z12MIbyW9V9fTFVS7y2E8T0GC3mtkOhJ-jmmwscsp8VNog1kRhphN_n1mj-vQcTnT1HOmkSNSKy3jHzjmzPaI5zzxjBBdoRb1YVhgHKqP9ectAtQnG8LofjYXtUERbTPgvVq3SW0NzVB_YKmzhMLd-c-NGDCslyuNuV41937vrhdmUuPLme25dfT7C-vU_8gNhdF9FB29M-KSJMGLhcANcPK'

function formatCycleDate() {
  const d = new Date()
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }).toUpperCase()
}

function reorderFullOrder(fullOrder, visibility, newVisibleOrder) {
  let i = 0
  return fullOrder.map((id) => {
    if (!visibility[id]) return id
    return newVisibleOrder[i++] ?? id
  })
}

function clonePanelLayout(lay) {
  return normalizePanelLayout({
    v: 3,
    visibility: { ...lay.visibility },
    order: [...lay.order],
    spans: { ...lay.spans },
    rowSpans: { ...lay.rowSpans },
    gridColumnStart: { ...lay.gridColumnStart },
  })
}

function useGridColumnResize(gridRef, id, span, setWidgetSpan) {
  return useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.button !== 0) return
      const grid = gridRef.current
      const handle = e.currentTarget
      if (!grid) return
      const span0 = clampWidgetColSpan(id, span)
      const startX = e.clientX
      const rect = grid.getBoundingClientRect()
      const styles = window.getComputedStyle(grid)
      const gapRaw = styles.columnGap || styles.gap || '0'
      const gap = Number.parseFloat(gapRaw) || 0
      const colW = Math.max(10, (rect.width - 11 * gap) / 12)

      let raf = 0
      let last = span0

      try {
        handle.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }

      const onMove = (ev) => {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
          const delta = Math.round((ev.clientX - startX) / colW)
          const next = clampWidgetColSpan(id, span0 + delta)
          if (next !== last) {
            last = next
            setWidgetSpan(id, next)
          }
        })
      }

      const onUp = (ev) => {
        cancelAnimationFrame(raf)
        try {
          if (handle.hasPointerCapture?.(ev.pointerId)) {
            handle.releasePointerCapture(ev.pointerId)
          }
        } catch {
          /* ignore */
        }
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [gridRef, id, span, setWidgetSpan],
  )
}

function useWidgetGridMove(gridRef, spans, placementMap, setWidgetGridStart) {
  return useCallback(
    (e, id) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.button !== 0) return
      const grid = gridRef.current
      if (!grid) return
      const span0 = clampWidgetColSpan(id, spans[id] ?? 12)
      if (span0 >= 12) return
      const maxStart = 12 - span0 + 1
      const anchorCol = Math.min(
        maxStart,
        Math.max(1, parsePlacementGridColumnStart(placementMap[id]?.gridColumn)),
      )
      const startX = e.clientX
      const startAnchor = anchorCol
      const captureEl = e.currentTarget

      const rect = grid.getBoundingClientRect()
      const styles = window.getComputedStyle(grid)
      const gapRaw = styles.columnGap || styles.gap || '0'
      const gap = Number.parseFloat(gapRaw) || 0
      const colW = Math.max(10, (rect.width - 11 * gap) / 12)

      let raf = 0
      let last = startAnchor

      try {
        captureEl.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }

      const onMove = (ev) => {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
          const delta = Math.round((ev.clientX - startX) / colW)
          const next = Math.min(maxStart, Math.max(1, startAnchor + delta))
          if (next !== last) {
            last = next
            setWidgetGridStart(id, next)
          }
        })
      }

      const onUp = (ev) => {
        cancelAnimationFrame(raf)
        try {
          if (captureEl?.hasPointerCapture?.(ev.pointerId)) {
            captureEl.releasePointerCapture(ev.pointerId)
          }
        } catch {
          /* ignore */
        }
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    },
    [gridRef, spans, placementMap, setWidgetGridStart],
  )
}

function EditSortableWidget({
  id,
  label,
  span,
  gridRef,
  setWidgetSpan,
  onRemove,
  onToggleWidth,
  onWidgetMovePointerDown,
  setWidgetGridStart,
  gridPlacement,
  children,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const cs = clampWidgetColSpan(id, span)
  const onResizePointerDown = useGridColumnResize(gridRef, id, span, setWidgetSpan)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: gridPlacement?.gridColumn ?? `span ${cs}`,
    gridRow: gridPlacement?.gridRow,
  }
  const widthTitle = `Genişlik: ${cs}/12 sütun — tıkla: önayar döngüsü; sağ kenardan sürükleyerek ayarla`
  const moveTitle =
    'Yatay konumu sürükle — çift tık: otomatik dizilime dön (yan yana sığdır)'
  return (
    <div
      ref={setNodeRef}
      style={style}
      data-bento-cols={String(cs)}
      className={`dashBentoItem dashBentoGridCell${isDragging ? ' isDragging' : ''}`}
    >
      <button
        type="button"
        className="dashBentoHandle"
        {...attributes}
        {...listeners}
        aria-label="Sürükleyerek sırala"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          drag_indicator
        </span>
      </button>
      <div className="dashBentoItemBody">
        <div className="dashPanelEditRow">
          <span className="dashPanelEditRowLabel">{label}</span>
          <div className="dashPanelEditRowActions">
            <button
              type="button"
              className="dashPanelWidthBtn dashPanelWidthBtnGlyph"
              onClick={() => onToggleWidth(id)}
              aria-label={widthTitle}
              title={widthTitle}
            >
              <PanelSpanGlyph span={cs} className="panelSpanGlyph" />
              <span className="dashPanelWidthBtnLbl">{cs}</span>
            </button>
            {cs < 12 ? (
              <button
                type="button"
                className="dashPanelWidthBtn dashPanelMoveBtn"
                onPointerDown={(e) => onWidgetMovePointerDown(e, id)}
                onDoubleClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setWidgetGridStart(id, null)
                }}
                aria-label={moveTitle}
                title={moveTitle}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  open_with
                </span>
              </button>
            ) : null}
            <button
              type="button"
              className="dashPanelRemoveBtn"
              onClick={() => onRemove(id)}
              aria-label={`${label} panelden kaldır`}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        </div>
        {children}
      </div>
      <button
        type="button"
        className="dashPanelResizeHandle"
        aria-label="Sürükleyerek sütun genişliği"
        title="Sağ kenarı sürükle — genişlik"
        onPointerDown={onResizePointerDown}
      />
    </div>
  )
}

export default function HomePage({
  habits,
  hasHabits,
  emptyHint,
  onAddHabit,
  onToggleDay,
  onDeleteHabit,
  onRenameHabit,
  loading,
  error,
  maxStreakDays = 0,
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const panelEditMode = searchParams.get('editPanel') === '1'
  const gridRef = useRef(null)
  const panelBaselineSig = useRef(null)
  const [editDraft, setEditDraft] = useState(null)
  const {
    layout: committedLayout,
    commitPanelLayout,
  } = usePanelWidgets()

  const panelLayout = panelEditMode && editDraft ? editDraft : committedLayout
  const w = panelLayout.visibility
  const order = panelLayout.order
  const spans = panelLayout.spans
  const gridColumnStart = panelLayout.gridColumnStart

  useLayoutEffect(() => {
    if (!panelEditMode) {
      setEditDraft(null)
      panelBaselineSig.current = null
      return
    }
    setEditDraft((prev) => {
      if (prev) return prev
      const snap = clonePanelLayout(committedLayout)
      panelBaselineSig.current = panelLayoutSignature(snap)
      return snap
    })
  }, [panelEditMode, committedLayout])

  const todayKey = toDateKey(new Date())
  const { pct: momentumPct } = todayCompletionStats(habits, todayKey)
  const previewHabits = habits.slice(0, PREVIEW_LIMIT)
  const hiddenCount = Math.max(0, habits.length - previewHabits.length)
  const tierNote =
    momentumPct >= 85 ? 'Üst %5 performans katmanı.' : 'Her işaret bir ilerleme.'

  const visibleIds = useMemo(() => order.filter((id) => w[id]), [order, w])
  const panelBentoPlacement = useMemo(
    () => computePanelBentoItemStyles(visibleIds, spans, gridColumnStart),
    [visibleIds, spans, gridColumnStart],
  )

  const patchEditDraft = useCallback((fn) => {
    setEditDraft((d) => {
      if (!d) return d
      const base = normalizePanelLayout({
        v: 3,
        visibility: { ...d.visibility },
        order: [...d.order],
        spans: { ...d.spans },
        rowSpans: { ...d.rowSpans },
        gridColumnStart: { ...d.gridColumnStart },
      })
      return fn(base)
    })
  }, [])

  const setDraftWidgetSpan = useCallback(
    (id, span) => {
      const n = clampWidgetColSpan(id, span)
      patchEditDraft((lay) => {
        const nextGs = { ...lay.gridColumnStart }
        const prevStart = nextGs[id]
        if (typeof prevStart === 'number' && Number.isFinite(prevStart)) {
          nextGs[id] = clampWidgetGridStartCol(id, n, prevStart)
        }
        return normalizePanelLayout({ ...lay, spans: { ...lay.spans, [id]: n }, gridColumnStart: nextGs })
      })
    },
    [patchEditDraft],
  )

  const toggleDraftWidgetSpan = useCallback(
    (id) => {
      patchEditDraft((lay) => {
        const cur = lay.spans[id] ?? 12
        const n = nextPanelGridWidthForWidget(id, cur)
        const nextGs = { ...lay.gridColumnStart }
        const prevStart = nextGs[id]
        if (typeof prevStart === 'number' && Number.isFinite(prevStart)) {
          nextGs[id] = clampWidgetGridStartCol(id, n, prevStart)
        }
        return normalizePanelLayout({ ...lay, spans: { ...lay.spans, [id]: n }, gridColumnStart: nextGs })
      })
    },
    [patchEditDraft],
  )

  const setDraftWidgetGridStart = useCallback(
    (id, columnStartOrNull) => {
      patchEditDraft((lay) => {
        const wSpan = lay.spans[id] ?? 12
        const nextGs = { ...lay.gridColumnStart }
        if (columnStartOrNull == null) nextGs[id] = null
        else nextGs[id] = clampWidgetGridStartCol(id, wSpan, columnStartOrNull)
        return normalizePanelLayout({ ...lay, gridColumnStart: nextGs })
      })
    },
    [patchEditDraft],
  )

  const onWidgetMovePointerDown = useWidgetGridMove(
    gridRef,
    spans,
    panelBentoPlacement,
    setDraftWidgetGridStart,
  )

  const editDirty =
    panelEditMode &&
    editDraft &&
    panelBaselineSig.current != null &&
    panelLayoutSignature(editDraft) !== panelBaselineSig.current

  useEffect(() => {
    if (!panelEditMode || !editDirty) return
    const beforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [panelEditMode, editDirty])

  const hasAnyWidget = visibleIds.length > 0
  const showProtocols = w.protocols

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = useCallback(
    (event) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = visibleIds.indexOf(active.id)
      const newIndex = visibleIds.indexOf(over.id)
      if (oldIndex < 0 || newIndex < 0) return
      const newVis = arrayMove(visibleIds, oldIndex, newIndex)
      setEditDraft((d) => {
        if (!d) return d
        const nextOrder = reorderFullOrder(d.order, d.visibility, newVis)
        return normalizePanelLayout({ ...d, order: nextOrder })
      })
    },
    [visibleIds],
  )

  const openPanelEdit = useCallback(() => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        n.set('editPanel', '1')
        return n
      },
      { replace: true },
    )
  }, [setSearchParams])

  const closePanelEdit = useCallback(() => {
    const dirty =
      editDraft &&
      panelBaselineSig.current != null &&
      panelLayoutSignature(editDraft) !== panelBaselineSig.current
    if (dirty) {
      if (!window.confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğine emin misin?')) return
    }
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        n.delete('editPanel')
        return n
      },
      { replace: true },
    )
  }, [setSearchParams, editDraft])

  const savePanelEdit = useCallback(() => {
    if (editDraft) commitPanelLayout(editDraft)
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        n.delete('editPanel')
        return n
      },
      { replace: true },
    )
  }, [editDraft, commitPanelLayout, setSearchParams])

  const resetDraftToFactory = useCallback(() => {
    setEditDraft((d) => {
      if (!d) return d
      return normalizePanelLayout(mergeReferenceBentoLayout(DEFAULT_PANEL_WIDGET_VISIBILITY))
    })
  }, [])

  const hiddenWidgetIds = useMemo(() => PANEL_WIDGET_IDS.filter((id) => !w[id]), [w])

  const removeWidget = useCallback(
    (id) => {
      patchEditDraft((lay) =>
        normalizePanelLayout({
          ...lay,
          visibility: { ...lay.visibility, [id]: false },
        }),
      )
    },
    [patchEditDraft],
  )

  const appendWidgetToDraft = useCallback(
    (id) => {
      patchEditDraft((lay) => {
        const nextOrder = [...lay.order.filter((x) => x !== id), id]
        return normalizePanelLayout({
          ...lay,
          visibility: { ...lay.visibility, [id]: true },
          order: nextOrder,
        })
      })
    },
    [patchEditDraft],
  )

  const renderWidget = (id) => {
    switch (id) {
      case 'hero':
        return (
          <section className="dashHeroGrid dashBentoHero">
            <div className="dashHeroCard">
              <div className="dashHeroInner">
                <span className="dashKicker">Komuta paneli</span>
                <h2 className="dashHeroTitle">Bugünün disiplini</h2>
                <p className="dashHeroBody">
                  {panelEditMode
                    ? 'Tutamaçla sırala; Kaydet ile uygula. İptal veya sekmeyi kapatırsan kaydedilmemiş değişiklikler sorulur.'
                    : 'Özet tek ekranda; sıra ve yerleşim Paneli düzenle ile yönetilir.'}
                </p>
                <div className="dashHeroActions">
                  {showProtocols ? (
                    <button
                      type="button"
                      className="dashBtnPrimary"
                      onClick={() =>
                        document.getElementById('protocol-add')?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        })
                      }
                    >
                      Protokol ekle
                    </button>
                  ) : (
                    <Link to="/protocols#protocol-add" className="dashBtnPrimary dashHeroLinkBtn">
                      Protokol ekle
                    </Link>
                  )}
                  {showProtocols ? (
                    <button
                      type="button"
                      className="dashBtnGhost"
                      onClick={() =>
                        document.getElementById('daily-protocols')?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        })
                      }
                    >
                      Günlük listeye in
                    </button>
                  ) : (
                    <Link to="/protocols" className="dashBtnGhost dashHeroLinkBtn">
                      Protokollere git
                    </Link>
                  )}
                </div>
              </div>
              <div className="dashHeroVisual">
                <img src={FOCUS_IMG} alt="" loading="lazy" />
                <div className="dashHeroSkew" />
              </div>
            </div>
          </section>
        )
      case 'streak':
        return (
          <div className="dashStreakCard">
            <div>
              <div className="dashStreakTop">
                <span className="material-symbols-outlined dashStreakBoltIco" aria-hidden="true">
                  bolt
                </span>
                <span className="dashStreakNumber">{maxStreakDays}</span>
              </div>
              <h3 className="dashStreakHeading">Günlük seri</h3>
              <p className="dashStreakSub">{tierNote}</p>
            </div>
            <div className="dashStreakMomentum">
              <div className="dashMomRow">
                <span>Momentum endeksi</span>
                <span>{momentumPct}%</span>
              </div>
              <div className="dashMomBar">
                <div className="dashMomFill" style={{ width: `${momentumPct}%` }} />
              </div>
            </div>
          </div>
        )
      case 'protocols':
        return (
          <div className="dashBentoProtocols" id="daily-protocols">
            <div className="dashSectionHead">
              <div>
                <h3 className="dashSectionTitle">Günlük protokoller</h3>
                <p className="dashSectionMeta">
                  {formatCycleDate()} // döngü
                </p>
              </div>
              {hasHabits ? (
                <Link to="/protocols" className="dashSectionExpand">
                  Tümünü aç{' '}
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
                    trending_flat
                  </span>
                </Link>
              ) : null}
            </div>
            <div id="protocol-add" className="dashAddBlock">
              <AddHabit onAdd={onAddHabit} />
            </div>
            {loading ? (
              <div className="dashEmpty">Veriler yükleniyor...</div>
            ) : hasHabits ? (
              <>
                <HabitList
                  habits={previewHabits}
                  onToggleDay={onToggleDay}
                  onDeleteHabit={onDeleteHabit}
                  onRenameHabit={onRenameHabit}
                />
                {hiddenCount > 0 ? (
                  <p className="dashPreviewMore">
                    <Link to="/protocols">+{hiddenCount} protokol daha — tam listeyi aç</Link>
                  </p>
                ) : null}
              </>
            ) : (
              <div className="dashEmpty">
                Henüz protokol yok.
                <span className="dashMuted"> {emptyHint}</span>
              </div>
            )}
          </div>
        )
      case 'completion':
        return (
          <div className="dashBentoCardWrap">
            <ProtocolCompletionCard habits={habits} />
          </div>
        )
      case 'heatmap':
        return (
          <div className="dashBentoCardWrap">
            <ExecutionHeatmapCard habits={habits} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="dashPage">
      {error ? <div className="authError dashBanner">{error}</div> : null}

      <DailySummaryStrip onOpenPanelEdit={openPanelEdit} panelEditMode={panelEditMode} />

      {panelEditMode ? (
        <div className="dashPanelEditBanner" role="status">
          <p className="dashPanelEditBannerText">
            <strong>Sürükle:</strong> tutaç sıra · <strong>sağ kenar</strong> genişlik ·{' '}
            <strong>dört ok</strong> yatay konum · çift tık dört ok = otomatik yan yana dizilim. Değişiklikler yalnızca{' '}
            <strong>Kaydet</strong>
            {' ile uygulanır.'}
          </p>
          <div className="dashPanelEditBannerActions">
            <button type="button" className="dashBtnGhost dashPanelResetBtn" onClick={resetDraftToFactory}>
              Sıfırla
            </button>
            <button type="button" className="dashBtnGhost dashPanelResetBtn" onClick={closePanelEdit}>
              İptal
            </button>
            <button type="button" className="dashBtnPrimary dashPanelEditDone" onClick={savePanelEdit}>
              Kaydet
            </button>
          </div>
        </div>
      ) : null}

      {!hasAnyWidget ? (
        <div className="dashEmpty dashPanelEmpty">
          Panelde görünür blok kalmadı.
          <span className="dashMuted">
            {' '}
            <button type="button" className="textButton" onClick={openPanelEdit}>
              Paneli düzenle
            </button>
            {' '}
            ile blok ekleyebilirsin.
          </span>
          {!panelEditMode ? (
            <div className="dashPanelEmptyCta">
              <button type="button" className="dashBtnPrimary" onClick={openPanelEdit}>
                Paneli düzenle
              </button>
            </div>
          ) : null}
        </div>
      ) : panelEditMode ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visibleIds}>
            <div ref={gridRef} className="dashBentoGrid isPanelEditing">
              {visibleIds.map((wid) => (
                <EditSortableWidget
                  key={wid}
                  id={wid}
                  label={PANEL_WIDGET_LABELS[wid]}
                  span={spans[wid] ?? 12}
                  gridRef={gridRef}
                  setWidgetSpan={setDraftWidgetSpan}
                  onRemove={removeWidget}
                  onToggleWidth={toggleDraftWidgetSpan}
                  onWidgetMovePointerDown={onWidgetMovePointerDown}
                  setWidgetGridStart={setDraftWidgetGridStart}
                  gridPlacement={panelBentoPlacement[wid]}
                >
                  {renderWidget(wid)}
                </EditSortableWidget>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div ref={gridRef} className="dashBentoGrid">
          {visibleIds.map((wid) => {
            const cs = clampWidgetColSpan(wid, spans[wid] ?? 12)
            const g = panelBentoPlacement[wid]
            return (
              <div
                key={wid}
                data-bento-cols={String(cs)}
                style={{
                  gridColumn: g?.gridColumn ?? `span ${cs}`,
                  gridRow: g?.gridRow,
                }}
                className="dashBentoItemStatic dashBentoGridCell"
              >
                {renderWidget(wid)}
              </div>
            )
          })}
        </div>
      )}

      {panelEditMode && hiddenWidgetIds.length > 0 ? (
        <section className="dashPanelAddSection" aria-label="Widget ekle">
          <h3 className="dashPanelAddTitle">Widget ekle</h3>
          <div className="dashPanelAddChips">
            {hiddenWidgetIds.map((id) => (
              <button
                key={id}
                type="button"
                className="dashPanelAddChip"
                onClick={() => appendWidgetToDraft(id)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  add
                </span>
                {PANEL_WIDGET_LABELS[id]}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
