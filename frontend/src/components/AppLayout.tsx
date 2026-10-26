import { Outlet } from 'react-router-dom'

import AppHeader from './AppHeader'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-page text-center">
      <AppHeader />
      <Outlet />
    </div>
  )
}
