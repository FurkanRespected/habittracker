import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import './monolith.css'
import AppShell from './components/AppShell.jsx'
import AuthForm from './components/AuthForm.jsx'
import useLocalStorage from './hooks/useLocalStorage.js'
import useCloudHabits from './hooks/useCloudHabits.js'
import useSupabaseSession from './hooks/useSupabaseSession.js'
import { supabase } from './lib/supabaseClient.js'
import ComingSoonPage from './pages/ComingSoonPage.jsx'
import HabitDetailPage from './pages/HabitDetailPage.jsx'
import HomePage from './pages/HomePage.jsx'
import { maxStreakAcrossHabits } from './utils/dashboardUtils.js'

function App() {
  const [habits, setHabits] = useLocalStorage('habits', [])
  const { session, loading, enabled } = useSupabaseSession()
  const cloud = useCloudHabits({ session, checksLookbackDays: 400 })

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
  const streakMax = maxStreakAcrossHabits(activeHabits)
  const activeHasHabits = activeHabits.length > 0

  function logActivity() {
    document.getElementById('protocol-add')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (enabled && loading) {
    return (
      <div className="shellBoot">
        <p>Oturum açılıyor...</p>
      </div>
    )
  }

  if (enabled && !session) {
    return (
      <Routes>
        <Route
          path="*"
          element={
            <main className="authPage">
              <AuthForm />
            </main>
          }
        />
      </Routes>
    )
  }

  const userLabel =
    enabled && session ? (session.user.email ?? 'Hesap') : 'Yerel kayıt'

  const shellProps = {
    streakDays: streakMax,
    userLabel,
    onSignOut: enabled && session ? signOut : undefined,
    onLogActivity: logActivity,
  }

  const homeHandlers =
    enabled && session
      ? {
          onAddHabit: cloud.addHabit,
          onToggleDay: cloud.toggleHabitDay,
          onDeleteHabit: cloud.deleteHabit,
          onRenameHabit: cloud.renameHabit,
          loading: cloud.loading,
          error: cloud.error,
        }
      : {
          onAddHabit: addHabit,
          onToggleDay: toggleHabitDay,
          onDeleteHabit: deleteHabit,
          onRenameHabit: renameHabit,
          loading: false,
          error: '',
        }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AppShell {...shellProps}>
            {!enabled ? (
              <div className="dashEmpty" style={{ marginBottom: '1rem' }}>
                Supabase ayarları yok. Şimdilik yerel kayıt ile devam ediyorsun.
                <span className="dashMuted"> Senkron için `.env` ayarla.</span>
              </div>
            ) : null}
            <HomePage
              habits={activeHabits}
              hasHabits={activeHasHabits}
              emptyHint="İlkini ekleyebilirsin."
              maxStreakDays={streakMax}
              {...homeHandlers}
            />
          </AppShell>
        }
      />
      <Route
        path="/insights"
        element={
          <AppShell {...shellProps}>
            <ComingSoonPage
              title="INSIGHTS"
              subtitle="Performans özeti ve heatmap yakında."
            />
          </AppShell>
        }
      />
      <Route
        path="/community"
        element={
          <AppShell {...shellProps}>
            <ComingSoonPage title="COMMUNITY" subtitle="Topluluk özellikleri yakında." />
          </AppShell>
        }
      />
      <Route
        path="/training"
        element={
          <AppShell {...shellProps}>
            <ComingSoonPage title="TRAINING" subtitle="Antrenman modülü yakında." />
          </AppShell>
        }
      />
      <Route
        path="/habit/:id"
        element={
          <AppShell {...shellProps}>
            <HabitDetailPage
              habits={activeHabits}
              onToggleDay={enabled && session ? cloud.toggleHabitDay : toggleHabitDay}
            />
          </AppShell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
