import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from './components/AppLayout'
import ApplicationDetailsPage from './pages/ApplicationDetailsPage'
import ApplicationsPage from './pages/ApplicationsPage'
import CompaniesPage from './pages/CompaniesPage'
import CompanyDetailsPage from './pages/CompanyDetailsPage'
import ContactDetailsPage from './pages/ContactDetailsPage'
import ContactsPage from './pages/ContactsPage'
import Dashboard from './pages/Dashboard'
import InterviewsPage from './pages/InterviewsPage'
import UiKitPage from './pages/UiKitPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/ui-kit" element={<UiKitPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/applications" replace />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/:applicationId" element={<ApplicationDetailsPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:companyId" element={<CompanyDetailsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/:contactId" element={<ContactDetailsPage />} />
          <Route path="/company" element={<Navigate to="/companies" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="*" element={<Navigate to="/applications" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
