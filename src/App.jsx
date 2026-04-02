import { Suspense, lazy } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import './monolith.css'
import './stitch-pages.css'
import AppShell from './components/AppShell.jsx'
import AuthForm from './components/AuthForm.jsx'
import RouteFallback from './components/RouteFallback.jsx'
import { PanelWidgetsProvider } from './hooks/usePanelWidgets.jsx'
import useAppearancePreferences from './hooks/useAppearancePreferences.js'
import useLocalStorage from './hooks/useLocalStorage.js'
import useCloudHabits from './hooks/useCloudHabits.js'
import useCloudNutrition from './hooks/useCloudNutrition.js'
import useCloudSupplements from './hooks/useCloudSupplements.js'
import useSupabaseSession from './hooks/useSupabaseSession.js'
import {
  LazyCommunityPage,
  LazyHabitDetailPage,
  LazyProfilePage,
  LazyProtocolsPage,
  LazySettingsPage,
  LazyTrainingLogOutlet,
  LazyTrainingNutritionOutlet,
  LazyTrainingOverviewOutlet,
  LazyTrainingPage,
  LazyTrainingSupplementsOutlet,
  LazyTasksPage,
  LazyFocusPage,
} from './lazyPages.jsx'
import HomePage from './pages/HomePage.jsx'
import { supabase } from './lib/supabaseClient.js'
import { maxStreakAcrossHabits } from './utils/dashboardUtils.js'

const LazyLandingPage = lazy(() => import('./pages/LandingPage.jsx'))

function GuestAuthScreen({ mode }) {
  return (
    <main className="authPage">
      <div className="authPageInner">
        <Link to="/" className="textButton authBackLink">
          ← Ana sayfa
        </Link>
        <AuthForm key={mode} initialMode={mode} />
      </div>
    </main>
  )
}

function App() {
  const [habits, setHabits] = useLocalStorage('habits', [])
  const { session, loading, enabled } = useSupabaseSession()
  const cloud = useCloudHabits({ session, checksLookbackDays: 400 })
  const cloudSupplements = useCloudSupplements({ session, logsLookbackDays: 400 })
  const cloudNutrition = useCloudNutrition({ session, lookbackDays: 30 })

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
  const appearance = useAppearancePreferences()

  if (enabled && loading) {
    return (
      <div className="shellBoot">
        <p>Oturum açılıyor...</p>
      </div>
    )
  }

  if (enabled && !session) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LazyLandingPage />} />
          <Route path="/welcome" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<GuestAuthScreen mode="signin" />} />
          <Route path="/signup" element={<GuestAuthScreen mode="signup" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    )
  }

  const userLabel =
    enabled && session ? (session.user.email ?? 'Hesap') : 'Yerel kayıt'

  const shellProps = {
    streakDays: streakMax,
    userLabel,
    onSignOut: enabled && session ? signOut : undefined,
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

  const protocolPageProps = {
    habits: activeHabits,
    hasHabits: activeHasHabits,
    emptyHint: 'İlkini ekleyebilirsin.',
    ...homeHandlers,
  }

  return (
    <PanelWidgetsProvider>
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<Navigate to="/panel" replace />} />
      <Route
        path="/panel"
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
        path="/protocols"
        element={
          <AppShell {...shellProps}>
            <LazyProtocolsPage {...protocolPageProps} />
          </AppShell>
        }
      />
      <Route
        path="/community"
        element={
          <AppShell {...shellProps}>
            <LazyCommunityPage habits={activeHabits} />
          </AppShell>
        }
      />
      <Route
        path="/tasks"
        element={
          <AppShell {...shellProps}>
            <LazyTasksPage />
          </AppShell>
        }
      />
      <Route
        path="/focus"
        element={
          <AppShell {...shellProps}>
            <LazyFocusPage />
          </AppShell>
        }
      />
      <Route
        path="/training"
        element={
          <AppShell {...shellProps}>
            <LazyTrainingPage
              habits={activeHabits}
              supplementsApi={enabled && session ? cloudSupplements : null}
              nutritionApi={enabled && session ? cloudNutrition : null}
            />
          </AppShell>
        }
      >
        <Route index element={<LazyTrainingOverviewOutlet />} />
        <Route path="log" element={<LazyTrainingLogOutlet />} />
        <Route path="supplements" element={<LazyTrainingSupplementsOutlet />} />
        <Route path="nutrition" element={<LazyTrainingNutritionOutlet />} />
        <Route path="*" element={<Navigate to="/training" replace />} />
      </Route>
      <Route
        path="/profile"
        element={
          <AppShell {...shellProps}>
            <LazyProfilePage
              userLabel={userLabel}
              sessionEmail={session?.user?.email ?? ''}
              hasCloud={Boolean(enabled && session)}
              habitCount={activeHabits.length}
              streakDays={streakMax}
            />
          </AppShell>
        }
      />
      <Route
        path="/settings"
        element={
          <AppShell {...shellProps}>
            <LazySettingsPage
              hasCloud={Boolean(enabled && session)}
              exportHabits={activeHabits}
              sessionEmail={session?.user?.email ?? ''}
              appearance={appearance}
            />
          </AppShell>
        }
      />
      <Route
        path="/habit/:id"
        element={
          <AppShell {...shellProps}>
            <LazyHabitDetailPage
              habits={activeHabits}
              onToggleDay={enabled && session ? cloud.toggleHabitDay : toggleHabitDay}
            />
          </AppShell>
        }
      />
      <Route path="/welcome" element={<Navigate to="/panel" replace />} />
      <Route path="*" element={<Navigate to="/panel" replace />} />
    </Routes>
    </Suspense>
    </PanelWidgetsProvider>
  )
}

export default App
