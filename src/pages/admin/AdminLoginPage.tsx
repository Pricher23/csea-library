import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '38px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  padding: '0 12px',
  fontSize: '14px',
  color: 'var(--color-text)',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: 'white',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--color-text)',
  marginBottom: '6px',
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: sbError } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (sbError) {
      setError('Email sau parolă incorectă.')
      return
    }

    navigate('/admin/dashboard', { replace: true })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: 'var(--color-text)',
            margin: '0 0 4px 0',
          }}
        >
          Biblioteca CSEA
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-text-muted)',
            margin: '0 0 32px 0',
          }}
        >
          Panou de administrare
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                required
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Parolă</label>
              <input
                type="password"
                value={password}
                required
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '40px',
              marginTop: '24px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'default' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-primary)'
            }}
          >
            {loading ? 'Se încarcă...' : 'Autentificare'}
          </button>

          {error && (
            <p
              style={{
                marginTop: '12px',
                fontSize: '13px',
                color: 'var(--color-error)',
                textAlign: 'center',
                margin: '12px 0 0 0',
              }}
            >
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
