import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ApplicationsPage from './pages/ApplicationsPage'
import Dashboard from './pages/Dashboard'
import InterviewsPage from './pages/InterviewsPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-page text-center">
        <Routes>
          <Route path="/" element={<ApplicationsPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
