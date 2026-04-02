import { useCallback, useId, useState } from 'react'
import useLocalStorage from '../hooks/useLocalStorage.js'

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function TasksPage() {
  const id = useId()
  const [store, setStore] = useLocalStorage('habitracker_tasks_v1', { items: [] })
  const items = Array.isArray(store?.items) ? store.items : []
  const [draft, setDraft] = useState('')

  const add = useCallback(() => {
    const t = draft.trim()
    if (!t) return
    setDraft('')
    setStore((prev) => ({
      items: [{ id: newId(), text: t, done: false }, ...((prev && prev.items) || [])],
    }))
  }, [draft, setStore])

  const toggle = useCallback(
    (taskId) => {
      setStore((prev) => ({
        items: ((prev && prev.items) || []).map((x) =>
          x.id === taskId ? { ...x, done: !x.done } : x,
        ),
      }))
    },
    [setStore],
  )

  const remove = useCallback(
    (taskId) => {
      setStore((prev) => ({
        items: ((prev && prev.items) || []).filter((x) => x.id !== taskId),
      }))
    },
    [setStore],
  )

  return (
    <div className="tasksPage">
      <header className="tasksHead">
        <p className="tasksKicker">GÖREVLER</p>
        <h1 className="tasksTitle">To-Do</h1>
        <p className="tasksSub">Yerel liste; bulut senkronu sonraki sürümde.</p>
      </header>
      <form
        className="tasksForm"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <label className="srOnly" htmlFor={id}>
          Yeni görev
        </label>
        <input
          id={id}
          className="tasksInput"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ne yapılacak?"
        />
        <button type="submit" className="tasksAddBtn">
          Ekle
        </button>
      </form>
      <ul className="tasksList">
        {items.length === 0 ? (
          <li className="tasksEmpty">Henüz görev yok.</li>
        ) : (
          items.map((it) => (
            <li key={it.id} className={`tasksItem${it.done ? ' isDone' : ''}`}>
              <button type="button" className="tasksCheck" onClick={() => toggle(it.id)}>
                {it.done ? '✓' : '○'}
              </button>
              <span className="tasksText">{it.text}</span>
              <button type="button" className="tasksDel" onClick={() => remove(it.id)}>
                Sil
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
