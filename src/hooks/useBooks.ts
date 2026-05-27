import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Book } from '../types'

interface UseBooksOptions {
  searchTerm: string
  collectionId: string | null
  availabilityFilter: 'all' | 'available'
  languageFilter: string | null
  page: number
  pageSize: number
}

interface UseBooksResult {
  books: Book[]
  totalCount: number
  loading: boolean
  error: string | null
}

export function useBooks(options: UseBooksOptions): UseBooksResult {
  const { searchTerm, collectionId, availabilityFilter, languageFilter, page, pageSize } = options

  const [books, setBooks] = useState<Book[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    let cancelled = false

    async function fetchBooks() {
      setLoading(true)
      setError(null)

      const from = page * pageSize
      const to = from + pageSize - 1

      try {
        let dataQuery: any = debouncedSearch
          ? supabase.rpc('search_books', { search_term: debouncedSearch })
          : supabase.from('books').select('*')

        let countQuery: any = debouncedSearch
          ? supabase.rpc('search_books', { search_term: debouncedSearch }, { count: 'exact', head: true })
          : supabase.from('books').select('*', { count: 'exact', head: true })

        if (availabilityFilter === 'available') {
          dataQuery = dataQuery.eq('is_available', true)
          countQuery = countQuery.eq('is_available', true)
        }
        if (collectionId !== null) {
          dataQuery = dataQuery.eq('collection_id', collectionId)
          countQuery = countQuery.eq('collection_id', collectionId)
        }
        if (languageFilter !== null) {
          dataQuery = dataQuery.eq('language', languageFilter)
          countQuery = countQuery.eq('language', languageFilter)
        }

        dataQuery = dataQuery.range(from, to)

        const [dataResult, countResult] = await Promise.all([dataQuery, countQuery])

        if (cancelled) return

        if (dataResult.error) throw new Error(dataResult.error.message)
        if (countResult.error) throw new Error(countResult.error.message)

        setBooks((dataResult.data as Book[]) ?? [])
        setTotalCount(countResult.count ?? 0)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchBooks()
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, collectionId, availabilityFilter, languageFilter, page, pageSize])

  return { books, totalCount, loading, error }
}
