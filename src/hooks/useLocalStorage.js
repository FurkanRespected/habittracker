import { useEffect, useState } from 'react'

function readLocalStorage(key, initialValue) {
  if (typeof window === 'undefined') return initialValue
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return initialValue
    return JSON.parse(raw)
  } catch {
    return initialValue
  }
}

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readLocalStorage(key, initialValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore write errors (quota, disabled storage, etc.)
    }
  }, [key, value])

  return [value, setValue]
}
