import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }    from '../context/AuthContext'
import PrivateRoute        from './PrivateRoute'
import Layout              from '../components/layout/Layout'
import LoginPage           from '../pages/auth/LoginPage'
import DashboardPage       from '../pages/DashboardPage'
import CompaniesPage       from '../pages/companies/CompaniesPage'
import CompanyEconomicActivitiesPage from '../pages/companies/CompanyEconomicActivitiesPage'
import EconomicActivitiesPage        from '../pages/catalog/EconomicActivitiesPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protegidas */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Empresas (super admin) */}
              <Route path="/companies" element={<CompaniesPage />} />

              {/* Actividades económicas por empresa (company_admin + super_admin) */}
              <Route
                path="/companies/:companyId/economic-activities"
                element={<CompanyEconomicActivitiesPage />}
              />

              {/* Catálogo MH (super admin) */}
              <Route
                path="/catalog/economic-activities"
                element={<EconomicActivitiesPage />}
              />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
