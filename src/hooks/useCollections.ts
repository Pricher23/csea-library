import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Collection } from '../types'

interface UseCollectionsResult {
  collections: Collection[]
  loading: boolean
  error: string | null
}

export function useCollections(): UseCollectionsResult {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchCollections() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: sbError } = await supabase
          .from('collections')
          .select('*')
          .order('name_ro')

        if (cancelled) return
        if (sbError) throw new Error(sbError.message)

        setCollections((data as Collection[]) ?? [])
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCollections()
    return () => {
      cancelled = true
    }
  }, [])

  return { collections, loading, error }
}
