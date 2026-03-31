import { useMemo } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AuthForm from './components/AuthForm.jsx'
import useLocalStorage from './hooks/useLocalStorage.js'
import useCloudHabits from './hooks/useCloudHabits.js'
import useSupabaseSession from './hooks/useSupabaseSession.js'
import { supabase } from './lib/supabaseClient.js'
import HabitDetailPage from './pages/HabitDetailPage.jsx'
import HomePage from './pages/HomePage.jsx'

function App() {
  const [habits, setHabits] = useLocalStorage('habits', [])
  const { session, loading, enabled } = useSupabaseSession()
  const cloud = useCloudHabits({ session, checksLookbackDays: 400 })

  const hasHabits = habits.length > 0

  async function signOut() {
    await supabase?.auth?.signOut?.()
  }

  function addHabit(name) {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

    setHabits((prev) => [{ id, name, history: {} }, ...prev])
  }

  function toggleHabitDay(habitId, dateKey, desiredDone) {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h
        const nextHistory = { ...(h.history || {}) }
        nextHistory[dateKey] = desiredDone ?? !nextHistory[dateKey]
        return { ...h, history: nextHistory }
      }),
    )
  }

  function deleteHabit(habitId) {
    setHabits((prev) => prev.filter((h) => h.id !== habitId))
  }

  function renameHabit(habitId, nextName) {
    const name = nextName.trim()
    if (!name) return
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, name } : h)))
  }

  const activeHabits = enabled && session ? cloud.habits : habits
  const activeHasHabits = activeHabits.length > 0
  const activeSubtitle = useMemo(() => {
    if (activeHasHabits) return 'Bugün hangilerini yaptın?'
    return 'Günlük alışkanlıklarını takip et. İlk alışkanlığını ekleyerek başla.'
  }, [activeHasHabits])

  const authedTopBar = session ? (
    <div className="topBar">
      <div className="topBarLeft muted">{session.user.email}</div>
      <button className="iconButton" type="button" onClick={signOut}>
        Çıkış
      </button>
    </div>
  ) : null

  return (
    <Routes>
      <Route
        path="/"
        element={
          enabled ? (
            loading ? (
              <HomePage
                subtitle={activeSubtitle}
                habits={[]}
                hasHabits={false}
                emptyHint=""
                onAddHabit={() => {}}
                onToggleDay={() => {}}
                onDeleteHabit={() => {}}
                onRenameHabit={() => {}}
                loading={true}
                error=""
              />
            ) : session ? (
              <HomePage
                subtitle={activeSubtitle}
                topBar={authedTopBar}
                habits={activeHabits}
                hasHabits={activeHasHabits}
                emptyHint="İlkini ekleyebilirsin."
                onAddHabit={cloud.addHabit}
                onToggleDay={cloud.toggleHabitDay}
                onDeleteHabit={cloud.deleteHabit}
                onRenameHabit={cloud.renameHabit}
                loading={cloud.loading}
                error={cloud.error}
              />
            ) : (
              <main className="page">
                <div className="container">
                  <AuthForm />
                </div>
              </main>
            )
          ) : (
            <HomePage
              subtitle={activeSubtitle}
              habits={habits}
              hasHabits={hasHabits}
              emptyHint="İlkini ekleyebilirsin."
              onAddHabit={addHabit}
              onToggleDay={toggleHabitDay}
              onDeleteHabit={deleteHabit}
              onRenameHabit={renameHabit}
              loading={false}
              error=""
              topBar={
                <div className="empty" style={{ marginBottom: 12 }}>
                  Supabase ayarları yok. Şimdilik local kayıt ile devam ediyorsun.
                  <span className="muted"> Senkron için `.env` ayarla.</span>
                </div>
              }
            />
          )
        }
      />

      <Route
        path="/habit/:id"
        element={
          enabled && !loading && !session ? (
            <Navigate to="/" replace />
          ) : (
            <HabitDetailPage
              habits={activeHabits}
              onToggleDay={enabled && session ? cloud.toggleHabitDay : toggleHabitDay}
            />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
