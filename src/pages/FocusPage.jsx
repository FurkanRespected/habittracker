import { useCallback, useEffect, useState } from 'react'
import useXpLocal from '../hooks/useXpLocal.js'

const DEFAULT_SEC = 25 * 60

export default function FocusPage() {
  const { total, addXp, events } = useXpLocal()
  const [sec, setSec] = useState(DEFAULT_SEC)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return undefined
    const t = window.setInterval(() => {
      setSec((s) => {
        if (s <= 1) {
          setRunning(false)
          addXp(10, 'focus_pomodoro')
          return DEFAULT_SEC
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [running, addXp])

  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')

  const toggle = useCallback(() => {
    setRunning((r) => !r)
  }, [])

  const reset = useCallback(() => {
    setRunning(false)
    setSec(DEFAULT_SEC)
  }, [])

  return (
    <div className="focusPage">
      <header className="focusHead">
        <p className="focusKicker">ODAK</p>
        <h1 className="focusTitle">Pomodoro</h1>
        <p className="focusSub">
          Bir turu bitirince <strong>+10 XP</strong> (yerel). Toplam XP: <strong>{total}</strong>
        </p>
      </header>
      <div className="focusTimer">
        <span className="focusClock">
          {mm}:{ss}
        </span>
        <div className="focusActions">
          <button type="button" className="focusBtn" onClick={toggle}>
            {running ? 'Duraklat' : sec <= 0 ? 'Başlat' : 'Başlat / Devam'}
          </button>
          <button type="button" className="focusBtn focusBtnGhost" onClick={reset}>
            Sıfırla
          </button>
        </div>
      </div>
      <section className="focusLog">
        <h2 className="focusLogTitle">Son XP</h2>
        <ul className="focusLogList">
          {events.slice(0, 12).map((e) => (
            <li key={e.id}>
              +{e.amount} · {e.source} · {new Date(e.at).toLocaleString('tr-TR')}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
