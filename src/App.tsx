import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import CatalogPage from './pages/public/CatalogPage'
import BookDetailPage from './pages/public/BookDetailPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminBooksPage from './pages/admin/AdminBooksPage'
import AdminLoansPage from './pages/admin/AdminLoansPage'
import AdminImportPage from './pages/admin/AdminImportPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AuthGuard from './components/AuthGuard'
import AdminLayout from './components/AdminLayout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/book/:id" element={<BookDetailPage />} />
      <Route path="/admin" element={<AdminRedirect />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <AuthGuard>
            <AdminLayout>
              <AdminDashboardPage />
            </AdminLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/admin/books"
        element={
          <AuthGuard>
            <AdminLayout>
              <AdminBooksPage />
            </AdminLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/admin/loans"
        element={
          <AuthGuard>
            <AdminLayout>
              <AdminLoansPage />
            </AdminLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/admin/import"
        element={
          <AuthGuard>
            <AdminLayout>
              <AdminImportPage />
            </AdminLayout>
          </AuthGuard>
        }
      />
    </Routes>
  )
}

function AdminRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/admin/login', { replace: true })
      }
    })
  }, [navigate])

  return null
}

export default App
