import { useId, useState } from 'react'

export default function AddHabit({ onAdd }) {
  const id = useId()
  const [name, setName] = useState('')

  function submit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <form className="addHabit" onSubmit={submit}>
      <label className="srOnly" htmlFor={id}>
        Alışkanlık adı
      </label>
      <input
        id={id}
        className="input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Örn. Su iç"
        autoComplete="off"
        inputMode="text"
      />
      <button className="button" type="submit" disabled={!name.trim()}>
        Ekle
      </button>
    </form>
  )
}
