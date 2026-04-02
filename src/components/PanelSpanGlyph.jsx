/** 12 sütunlu gridde satırda kaç eşit blok sığar + 8 için 8:4 bento oranı. */
export default function PanelSpanGlyph({ span, className = '' }) {
  const s = Math.min(12, Math.max(1, Math.round(Number(span)) || 12))
  const w = 22
  const h = 12
  const gap = 1.5

  if (s >= 12) {
    return (
      <svg
        className={className}
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        aria-hidden="true"
      >
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx="1.5" fill="currentColor" opacity="0.35" />
      </svg>
    )
  }

  if (s === 8) {
    const wMain = (w - gap) * (8 / 12)
    const wSide = w - gap - wMain
    return (
      <svg className={className} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <rect x="0.5" y="0.5" width={wMain - 1} height={h - 1} rx="1.2" fill="currentColor" opacity="0.35" />
        <rect
          x={wMain + gap + 0.5}
          y="0.5"
          width={wSide - 1}
          height={h - 1}
          rx="1.2"
          fill="currentColor"
          opacity="0.22"
        />
      </svg>
    )
  }

  const perRow = Math.max(2, Math.min(4, Math.round(12 / s)))
  const innerW = w - (perRow - 1) * gap
  const cell = innerW / perRow
  const rects = []
  for (let i = 0; i < perRow; i++) {
    const x = i * (cell + gap)
    rects.push(
      <rect
        key={i}
        x={x + 0.5}
        y="0.5"
        width={cell - 1}
        height={h - 1}
        rx="1.2"
        fill="currentColor"
        opacity="0.35"
      />,
    )
  }

  return (
    <svg className={className} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {rects}
    </svg>
  )
}
