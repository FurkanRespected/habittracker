export default function RouteFallback() {
  return (
    <div className="routeFallback" role="status" aria-live="polite">
      <div className="routeFallbackInner">
        <span className="routeFallbackDot" aria-hidden="true" />
        <p className="routeFallbackText">Yükleniyor…</p>
      </div>
    </div>
  )
}
