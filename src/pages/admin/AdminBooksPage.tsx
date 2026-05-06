import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useCollections } from '../../hooks/useCollections'
import type { Book } from '../../types'

interface BookFormData {
  title: string
  author: string
  isbn: string
  publisher: string
  year: string
  language: string
  genre: string
  volumes: string
  location: string
  collection_id: string
  description: string
  is_available: boolean
}

interface OpenLibraryBook {
  title?: string
  authors?: { name: string }[]
  publishers?: { name: string }[]
  publish_date?: string
}

const EMPTY_FORM: BookFormData = {
  title: '',
  author: '',
  isbn: '',
  publisher: '',
  year: '',
  language: 'ro',
  genre: '',
  volumes: '1',
  location: '',
  collection_id: '',
  description: '',
  is_available: true,
}

const LANGUAGE_OPTIONS = [
  { value: 'ro', label: 'Română' },
  { value: 'en', label: 'Engleză' },
  { value: 'ja', label: 'Japoneză' },
  { value: 'other', label: 'Altele' },
]

const GENRE_OPTIONS = [
  'Literatură',
  'Gramatică',
  'Istorie',
  'Cultură',
  'Limbă',
  'Altele',
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '38px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  padding: '0 12px',
  fontSize: '14px',
  color: 'var(--color-text)',
  backgroundColor: 'white',
  outline: 'none',
  boxSizing: 'border-box',
}

function fieldFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--color-primary)'
}
function fieldBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--color-border)'
}

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '4px' }}>
      {text}
      {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
    </label>
  )
}

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [filteredCount, setFilteredCount] = useState(0)

  // Search & filters
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterCollectionId, setFilterCollectionId] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'borrowed'>('all')
  const [filterGenre, setFilterGenre] = useState('')
  const [genres, setGenres] = useState<string[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [form, setForm] = useState<BookFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isbnSearching, setIsbnSearching] = useState(false)
  const [isbnNotFound, setIsbnNotFound] = useState(false)

  const { collections } = useCollections()

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch total (unfiltered) count once + after mutations
  const fetchTotalCount = useCallback(async () => {
    const { count } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
    setTotalCount(count ?? 0)
  }, [])

  // Fetch distinct genres once on mount
  useEffect(() => {
    supabase
      .from('books')
      .select('genre')
      .not('genre', 'is', null)
      .then(({ data }) => {
        const unique = [
          ...new Set((data as { genre: string }[]).map((r) => r.genre)),
        ].sort()
        setGenres(unique)
      })
  }, [])

  const fetchBooks = useCallback(async () => {
    setLoadingBooks(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('books')
      .select('*, collection:collections(*)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (debouncedSearch) {
      query = query.or(`title.ilike.%${debouncedSearch}%,author.ilike.%${debouncedSearch}%`)
    }
    if (filterCollectionId) {
      query = query.eq('collection_id', filterCollectionId)
    }
    if (filterStatus === 'available') {
      query = query.eq('is_available', true)
    } else if (filterStatus === 'borrowed') {
      query = query.eq('is_available', false)
    }
    if (filterGenre) {
      query = query.eq('genre', filterGenre)
    }

    const { data, count } = await query
    setBooks((data as Book[]) ?? [])
    setFilteredCount(count ?? 0)
    setLoadingBooks(false)
  }, [debouncedSearch, filterCollectionId, filterStatus, filterGenre])

  useEffect(() => {
    fetchTotalCount()
  }, [fetchTotalCount])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const hasFilters =
    !!searchTerm || !!filterCollectionId || filterStatus !== 'all' || !!filterGenre

  function resetFilters() {
    setSearchTerm('')
    setDebouncedSearch('')
    setFilterCollectionId('')
    setFilterStatus('all')
    setFilterGenre('')
  }

  function openAdd() {
    setEditingBook(null)
    setForm(EMPTY_FORM)
    setSaveError(null)
    setIsbnNotFound(false)
    setModalOpen(true)
  }

  function openEdit(book: Book) {
    setEditingBook(book)
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn ?? '',
      publisher: book.publisher ?? '',
      year: book.year?.toString() ?? '',
      language: book.language,
      genre: book.genre ?? '',
      volumes: book.volumes.toString(),
      location: book.location,
      collection_id: book.collection_id ?? '',
      description: book.description ?? '',
      is_available: book.is_available,
    })
    setSaveError(null)
    setIsbnNotFound(false)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingBook(null)
    setSaveError(null)
    setIsbnNotFound(false)
  }

  function setField<K extends keyof BookFormData>(key: K, value: BookFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'isbn') setIsbnNotFound(false)
  }

  async function handleIsbnSearch() {
    if (!form.isbn.trim()) return
    setIsbnSearching(true)
    setIsbnNotFound(false)
    try {
      const res = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${form.isbn.trim()}&format=json&jscmd=data`
      )
      const data = await res.json() as Record<string, OpenLibraryBook>
      const entry = data[`ISBN:${form.isbn.trim()}`]
      if (!entry) {
        setIsbnNotFound(true)
      } else {
        const yearMatch = entry.publish_date?.match(/\d{4}/)
        setForm((prev) => ({
          ...prev,
          title: prev.title || entry.title || '',
          author: prev.author || entry.authors?.[0]?.name || '',
          publisher: prev.publisher || entry.publishers?.[0]?.name || '',
          year: prev.year || (yearMatch ? yearMatch[0] : ''),
        }))
      }
    } catch {
      setIsbnNotFound(true)
    }
    setIsbnSearching(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const payload = {
      title: form.title,
      author: form.author,
      isbn: form.isbn.trim() || null,
      publisher: form.publisher.trim() || null,
      year: form.year ? parseInt(form.year, 10) : null,
      language: form.language,
      genre: form.genre || null,
      volumes: parseInt(form.volumes, 10) || 1,
      location: form.location,
      collection_id: form.collection_id || null,
      description: form.description.trim() || null,
      is_available: form.is_available,
    }
    const { error } = editingBook
      ? await supabase.from('books').update(payload).eq('id', editingBook.id)
      : await supabase.from('books').insert(payload)
    setSaving(false)
    if (error) {
      setSaveError('A apărut o eroare. Încearcă din nou.')
      return
    }
    closeModal()
    fetchBooks()
    fetchTotalCount()
  }

  async function handleDelete(book: Book) {
    if (!window.confirm('Ești sigur că vrei să ștergi această carte?')) return
    await supabase.from('books').delete().eq('id', book.id)
    fetchBooks()
    fetchTotalCount()
  }

  return (
    <>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Cărți</h1>
        <button
          onClick={openAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary)' }}
        >
          <Plus size={16} />
          Adaugă carte
        </button>
      </div>

      {/* Count line */}
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 12px' }}>
        {hasFilters
          ? <><strong style={{ color: 'var(--color-text)' }}>{filteredCount}</strong> din {totalCount} cărți</>
          : <><strong style={{ color: 'var(--color-text)' }}>{totalCount}</strong> cărți în colecție</>
        }
      </p>

      {/* Search + filter row */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            <Search size={15} />
          </span>
          <input
            type="text"
            value={searchTerm}
            placeholder="Caută după titlu sau autor..."
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: '36px',
              paddingLeft: '32px',
              paddingRight: '10px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              backgroundColor: 'white',
              fontSize: '14px',
              color: 'var(--color-text)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
          />
        </div>

        {/* Collection filter */}
        <select
          value={filterCollectionId}
          onChange={(e) => setFilterCollectionId(e.target.value)}
          style={{ height: '36px', border: '1px solid var(--color-border)', borderRadius: '6px', backgroundColor: 'white', fontSize: '14px', color: 'var(--color-text)', padding: '0 8px', cursor: 'pointer' }}
        >
          <option value="">Toate colecțiile</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name_ro}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'available' | 'borrowed')}
          style={{ height: '36px', border: '1px solid var(--color-border)', borderRadius: '6px', backgroundColor: 'white', fontSize: '14px', color: 'var(--color-text)', padding: '0 8px', cursor: 'pointer' }}
        >
          <option value="all">Toate</option>
          <option value="available">Disponibil</option>
          <option value="borrowed">Împrumutat</option>
        </select>

        {/* Genre filter */}
        <select
          value={filterGenre}
          onChange={(e) => setFilterGenre(e.target.value)}
          style={{ height: '36px', border: '1px solid var(--color-border)', borderRadius: '6px', backgroundColor: 'white', fontSize: '14px', color: 'var(--color-text)', padding: '0 8px', cursor: 'pointer' }}
        >
          <option value="">Toate genurile</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        {/* Reset button — only when filters active */}
        {hasFilters && (
          <button
            onClick={resetFilters}
            style={{ background: 'none', border: 'none', fontSize: '14px', color: 'var(--color-primary)', cursor: 'pointer', padding: '0 4px', whiteSpace: 'nowrap' }}
          >
            Resetează filtrele
          </button>
        )}
      </div>

      {/* Table */}
      {loadingBooks ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '48px' }}>
          Se încarcă...
        </p>
      ) : (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#EDEAE5' }}>
                  {['#', 'Titlu', 'Autor', 'Colecție', 'Limbă', 'Locație', 'Status', 'Acțiuni'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid var(--color-border)',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {books.map((book, idx) => (
                  <tr
                    key={book.id}
                    style={{ backgroundColor: 'white', borderBottom: '1px solid var(--color-border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9F8F5' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white' }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {idx + 1}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--color-text)',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {book.title}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                      {book.author}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                      {book.collection?.name_ro ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                      {book.language.toUpperCase()}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                      {book.location}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: book.is_available ? '#437A22' : '#964219' }}>
                        {book.is_available ? 'Disponibil' : 'Împrumutat'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <ActionButton
                          onClick={() => openEdit(book)}
                          hoverColor="var(--color-primary)"
                          title="Editează"
                        >
                          <Pencil size={16} />
                        </ActionButton>
                        <ActionButton
                          onClick={() => handleDelete(book)}
                          hoverColor="var(--color-error)"
                          title="Șterge"
                        >
                          <Trash2 size={16} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {books.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ padding: '48px 16px', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}
                    >
                      Nu există cărți înregistrate.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '32px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                {editingBook ? 'Editează carte' : 'Adaugă carte'}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', borderRadius: '6px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Row 1: Titlu */}
              <div>
                <FieldLabel text="Titlu" required />
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  style={inputStyle}
                  onFocus={fieldFocus}
                  onBlur={fieldBlur}
                />
              </div>

              {/* Row 2: Autor */}
              <div>
                <FieldLabel text="Autor" required />
                <input
                  type="text"
                  required
                  value={form.author}
                  onChange={(e) => setField('author', e.target.value)}
                  style={inputStyle}
                  onFocus={fieldFocus}
                  onBlur={fieldBlur}
                />
              </div>

              {/* Row 3: ISBN + button */}
              <div>
                <FieldLabel text="ISBN" />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={form.isbn}
                    onChange={(e) => setField('isbn', e.target.value)}
                    style={{ ...inputStyle, flex: 1, width: 'auto' }}
                    onFocus={fieldFocus}
                    onBlur={fieldBlur}
                  />
                  <button
                    type="button"
                    onClick={handleIsbnSearch}
                    disabled={isbnSearching}
                    style={{
                      height: '38px',
                      padding: '0 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      backgroundColor: 'white',
                      cursor: isbnSearching ? 'default' : 'pointer',
                      color: 'var(--color-primary)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { if (!isbnSearching) e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                    onMouseLeave={(e) => { if (!isbnSearching) e.currentTarget.style.borderColor = 'var(--color-border)' }}
                  >
                    {isbnSearching ? 'Se caută...' : 'Caută ISBN'}
                  </button>
                </div>
                {isbnNotFound && (
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    ISBN negăsit.
                  </p>
                )}
              </div>

              {/* Row 4: Editură + An */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <FieldLabel text="Editură" />
                  <input
                    type="text"
                    value={form.publisher}
                    onChange={(e) => setField('publisher', e.target.value)}
                    style={inputStyle}
                    onFocus={fieldFocus}
                    onBlur={fieldBlur}
                  />
                </div>
                <div>
                  <FieldLabel text="An" />
                  <input
                    type="number"
                    min={1800}
                    max={2100}
                    value={form.year}
                    onChange={(e) => setField('year', e.target.value)}
                    style={inputStyle}
                    onFocus={fieldFocus}
                    onBlur={fieldBlur}
                  />
                </div>
              </div>

              {/* Row 5: Limbă + Gen */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <FieldLabel text="Limbă" />
                  <select
                    value={form.language}
                    onChange={(e) => setField('language', e.target.value)}
                    style={inputStyle}
                    onFocus={fieldFocus}
                    onBlur={fieldBlur}
                  >
                    {LANGUAGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel text="Gen" />
                  <select
                    value={form.genre}
                    onChange={(e) => setField('genre', e.target.value)}
                    style={inputStyle}
                    onFocus={fieldFocus}
                    onBlur={fieldBlur}
                  >
                    <option value="">—</option>
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 6: Exemplare + Locație */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <FieldLabel text="Exemplare" />
                  <input
                    type="number"
                    min={1}
                    value={form.volumes}
                    onChange={(e) => setField('volumes', e.target.value)}
                    style={inputStyle}
                    onFocus={fieldFocus}
                    onBlur={fieldBlur}
                  />
                </div>
                <div>
                  <FieldLabel text="Locație" required />
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setField('location', e.target.value)}
                    style={inputStyle}
                    onFocus={fieldFocus}
                    onBlur={fieldBlur}
                  />
                </div>
              </div>

              {/* Row 7: Colecție */}
              <div>
                <FieldLabel text="Colecție" />
                <select
                  value={form.collection_id}
                  onChange={(e) => setField('collection_id', e.target.value)}
                  style={inputStyle}
                  onFocus={fieldFocus}
                  onBlur={fieldBlur}
                >
                  <option value="">Fără colecție</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_ro}</option>
                  ))}
                </select>
              </div>

              {/* Row 8: Descriere */}
              <div>
                <FieldLabel text="Descriere" />
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  style={{
                    width: '100%',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    color: 'var(--color-text)',
                    backgroundColor: 'white',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  onFocus={fieldFocus}
                  onBlur={fieldBlur}
                />
              </div>

              {/* Row 9: Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="is_available"
                  checked={form.is_available}
                  onChange={(e) => setField('is_available', e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                />
                <label
                  htmlFor="is_available"
                  style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', cursor: 'pointer' }}
                >
                  Disponibil
                </label>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={closeModal}
                disabled={saving}
                style={{
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'white',
                  color: 'var(--color-text)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: saving ? 'default' : 'pointer',
                }}
              >
                Anulează
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.author || !form.location}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: saving ? 'default' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)' }}
                onMouseLeave={(e) => { if (!saving) e.currentTarget.style.backgroundColor = 'var(--color-primary)' }}
              >
                {saving ? 'Se salvează...' : 'Salvează'}
              </button>
            </div>
            {saveError && (
              <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-error)', textAlign: 'right' }}>
                {saveError}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ActionButton({
  onClick,
  hoverColor,
  title,
  children,
}: {
  onClick: () => void
  hoverColor: string
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--color-text-muted)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = hoverColor
        e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--color-text-muted)'
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {children}
    </button>
  )
}
