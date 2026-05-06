import { Routes, Route } from 'react-router-dom'
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
      <Route path="/admin" element={<div>Admin panel — coming soon</div>} />
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

export default App
