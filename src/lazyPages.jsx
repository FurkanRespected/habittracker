import { lazy } from 'react'

/** Ağır sayfalar — ana bundle küçülsün diye lazy. HomePage bilinçli olarak eager. */
export const LazyProtocolsPage = lazy(() => import('./pages/ProtocolsPage.jsx'))
export const LazyCommunityPage = lazy(() => import('./pages/CommunityPage.jsx'))
export const LazyTrainingPage = lazy(() => import('./pages/TrainingPage.jsx'))
export const LazyProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
export const LazySettingsPage = lazy(() => import('./pages/SettingsPage.jsx'))
export const LazyHabitDetailPage = lazy(() => import('./pages/HabitDetailPage.jsx'))

export const LazyTrainingOverviewOutlet = lazy(() =>
  import('./pages/TrainingPage.jsx').then((m) => ({ default: m.TrainingOverviewOutlet })),
)
export const LazyTrainingLogOutlet = lazy(() =>
  import('./pages/TrainingPage.jsx').then((m) => ({ default: m.TrainingLogOutlet })),
)
export const LazyTrainingSupplementsOutlet = lazy(() =>
  import('./pages/TrainingPage.jsx').then((m) => ({ default: m.TrainingSupplementsOutlet })),
)
export const LazyTrainingNutritionOutlet = lazy(() =>
  import('./pages/TrainingPage.jsx').then((m) => ({ default: m.TrainingNutritionOutlet })),
)

export const LazyTasksPage = lazy(() => import('./pages/TasksPage.jsx'))
export const LazyFocusPage = lazy(() => import('./pages/FocusPage.jsx'))
