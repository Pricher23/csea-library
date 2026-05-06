import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import i18n from '../../lib/i18n'
import { Search } from 'lucide-react'
import { useBooks } from '../../hooks/useBooks'
import { useCollections } from '../../hooks/useCollections'
import type { Book, Collection, Language } from '../../types'

const PAGE_SIZE = 12

const LANG_NAME_FIELD: Record<Language, keyof Pick<Collection, 'name_ro' | 'name_en' | 'name_ja'>> = {
  ro: 'name_ro',
  en: 'name_en',
  ja: 'name_ja',
}

export default function CatalogPage() {
  const { t, i18n: i18nInstance } = useTranslation()
  const navigate = useNavigate()
  const currentLang = (i18nInstance.language ?? 'ro') as Language

  const [searchTerm, setSearchTerm] = useState('')
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>('all')
  const [languageFilter, setLanguageFilter] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const { books, totalCount, loading, error } = useBooks({
    searchTerm,
    collectionId,
    availabilityFilter,
    languageFilter,
    page,
    pageSize: PAGE_SIZE,
  })

  const { collections } = useCollections()

  const nameField = LANG_NAME_FIELD[currentLang] ?? 'name_ro'

  const collectionsMap = new Map<string, Collection>(
    collections.map((c) => [c.id, c])
  )

  const langs = [
    { code: 'ro', label: 'RO' },
    { code: 'en', label: 'EN' },
    { code: 'ja', label: '日本語' },
  ]

  function resetPage() {
    setPage(0)
  }

  const selectStyle: React.CSSProperties = {
    height: '36px',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    backgroundColor: 'white',
    fontSize: '14px',
    color: 'var(--color-text)',
    paddingLeft: '8px',
    paddingRight: '8px',
    cursor: 'pointer',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Navbar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          height: '56px',
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
          {t('app.title')}
        </span>

        <div style={{ display: 'flex', gap: '4px' }}>
          {langs.map(({ code, label }) => {
            const active = currentLang === code
            return (
              <button
                key={code}
                onClick={() => i18n.changeLanguage(code)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: active ? 600 : 400,
                  padding: '4px 8px',
                  color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main content */}
      <main style={{ maxWidth: '960px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
        {/* Search bar */}
        <div style={{ marginTop: '32px', position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            placeholder={t('catalog.search_placeholder')}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              resetPage()
            }}
            style={{
              width: '100%',
              height: '40px',
              paddingLeft: '34px',
              paddingRight: '12px',
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

        {/* Filter row */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Collection filter */}
          <select
            style={selectStyle}
            value={collectionId ?? ''}
            onChange={(e) => {
              setCollectionId(e.target.value === '' ? null : e.target.value)
              resetPage()
            }}
          >
            <option value="">{t('catalog.filter_all_collections')}</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c[nameField]}
              </option>
            ))}
          </select>

          {/* Availability filter */}
          <select
            style={selectStyle}
            value={availabilityFilter}
            onChange={(e) => {
              setAvailabilityFilter(e.target.value as 'all' | 'available')
              resetPage()
            }}
          >
            <option value="all">{t('catalog.filter_all')}</option>
            <option value="available">{t('catalog.filter_available')}</option>
          </select>

          {/* Language filter */}
          <select
            style={selectStyle}
            value={languageFilter ?? ''}
            onChange={(e) => {
              setLanguageFilter(e.target.value === '' ? null : e.target.value)
              resetPage()
            }}
          >
            <option value="">{t('catalog.filter_any_language')}</option>
            <option value="Romanian">{t('catalog.filter_lang_ro')}</option>
            <option value="English">{t('catalog.filter_lang_en')}</option>
            <option value="Japanese">{t('catalog.filter_lang_ja')}</option>
            <option value="Other">{t('catalog.filter_lang_other')}</option>
          </select>
        </div>

        {/* Book grid */}
        <div
          style={{
            marginTop: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '20px',
          }}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : error ? null : books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              collectionName={
                book.collection_id
                  ? (collectionsMap.get(book.collection_id)?.[nameField] ?? '—')
                  : '—'
              }
              availableLabel={t('book.available')}
              borrowedLabel={t('book.borrowed')}
              onClick={() => navigate(`/book/${book.id}`)}
            />
          ))}
        </div>

        {/* Error state */}
        {error && (
          <p style={{ marginTop: '48px', textAlign: 'center', color: 'var(--color-error)', fontSize: '14px' }}>
            {t('catalog.error')}
          </p>
        )}

        {/* Empty state */}
        {!loading && !error && books.length === 0 && (
          <p style={{ marginTop: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            {t('catalog.empty')}
          </p>
        )}

        {/* Pagination */}
        <div
          style={{
            marginTop: '32px',
            marginBottom: '48px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <PaginationButton
            label={t('catalog.previous')}
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          />
          <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            {t('catalog.page_of', { current: page + 1, total: Math.ceil(totalCount / PAGE_SIZE) || 1 })}
          </span>
          <PaginationButton
            label={t('catalog.next')}
            disabled={(page + 1) * PAGE_SIZE >= totalCount}
            onClick={() => setPage((p) => p + 1)}
          />
        </div>
      </main>
    </div>
  )
}

function BookCard({
  book,
  collectionName,
  availableLabel,
  borrowedLabel,
  onClick,
}: {
  book: Book
  collectionName: string
  availableLabel: string
  borrowedLabel: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
      }}
    >
      <div>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--color-text)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4',
          }}
        >
          {book.title}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          {book.author}
        </div>
      </div>

      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        {book.genre ?? '—'} · {book.language}
      </div>

      <div
        style={{
          marginTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {collectionName}
        </span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: book.is_available ? '#437A22' : '#964219',
          }}
        >
          {book.is_available ? availableLabel : borrowedLabel}
        </span>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div className="skeleton" style={{ height: '18px', width: '85%' }} />
      <div className="skeleton" style={{ height: '18px', width: '60%' }} />
      <div className="skeleton" style={{ height: '13px', width: '40%', marginTop: '4px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <div className="skeleton" style={{ height: '13px', width: '35%' }} />
        <div className="skeleton" style={{ height: '13px', width: '20%' }} />
      </div>
    </div>
  )
}

function PaginationButton({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '6px 16px',
        fontSize: '14px',
        backgroundColor: 'white',
        color: disabled ? 'var(--color-text-muted)' : 'var(--color-text)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.borderColor = 'var(--color-primary)'
        e.currentTarget.style.color = 'var(--color-primary)'
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.color = 'var(--color-text)'
      }}
    >
      {label}
    </button>
  )
}
