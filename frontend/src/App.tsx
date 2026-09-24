
import './App.css'
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import ApplicationsPage from './pages/ApplicationsPage'
import Dashboard from './pages/Dashboard'
import InterviewsPage from './pages/InterviewsPage'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <NavLink className="app-brand" to="/">
            CareerFlow
          </NavLink>

          <nav className="app-navigation" aria-label="Main navigation">
            <NavLink
              className={({ isActive }) => (isActive ? 'active' : undefined)}
              to="/"
              end
            >
              Dashboard
            </NavLink>
            <NavLink
              className={({ isActive }) => (isActive ? 'active' : undefined)}
              to="/applications"
            >
              Job applications
            </NavLink>
            <NavLink
              className={({ isActive }) => (isActive ? 'active' : undefined)}
              to="/interviews"
            >
              Interviews
            </NavLink>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
