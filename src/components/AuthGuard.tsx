import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthGuard({ children }: React.PropsWithChildren) {
  const navigate = useNavigate()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/admin/login', { replace: true })
      }
      setChecked(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/admin/login', { replace: true })
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [navigate])

  if (!checked) return null

  return <>{children}</>
}
