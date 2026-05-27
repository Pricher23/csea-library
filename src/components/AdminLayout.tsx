import { NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, BookMarked, Upload, LayoutDashboard, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'

const NAV_ITEMS = [
  { to: '/admin/books', label: 'Cărți', Icon: BookOpen },
  { to: '/admin/loans', label: 'Împrumuturi', Icon: BookMarked },
  { to: '/admin/import', label: 'Import CSV', Icon: Upload },
  { to: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
]

export default function AdminLayout({ children }: React.PropsWithChildren) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '220px',
          flexShrink: 0,
          height: '100vh',
          backgroundColor: '#EDEAE5',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
        }}
      >
        {/* Branding */}
        <div
          style={{
            padding: '20px 16px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/logo.png"
              alt="CSEA Logo"
              width={24}
              height={24}
              style={{ borderRadius: '4px', objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
              Biblioteca CSEA
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Admin
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '8px' }}>
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '14px',
                textDecoration: 'none',
                width: '100%',
                marginBottom: '2px',
                boxSizing: 'border-box',
                backgroundColor: isActive ? 'white' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: isActive ? 500 : 400,
              })}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                if (!el.getAttribute('aria-current')) {
                  el.style.backgroundColor = 'rgba(0,0,0,0.04)'
                  el.style.color = 'var(--color-text)'
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                if (!el.getAttribute('aria-current')) {
                  el.style.backgroundColor = 'transparent'
                  el.style.color = 'var(--color-text-muted)'
                }
              }}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'
              e.currentTarget.style.color = 'var(--color-text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-muted)'
            }}
          >
            <LogOut size={16} />
            Ieșire
          </button>
        </div>
      </aside>

      {/* Content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            height: '52px',
            flexShrink: 0,
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
          }}
        >
          <div id="admin-page-title" />
        </div>

        {/* Scrollable main */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: 'var(--color-bg)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
