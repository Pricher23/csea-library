import { useState, useEffect, Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, BookOpen } from 'lucide-react'
import i18n from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import type { Book, Language } from '../../types'

const LANGS = [
  { code: 'ro', label: 'RO' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: '日本語' },
]

const NAME_FIELD: Record<Language, 'name_ro' | 'name_en' | 'name_ja'> = {
  ro: 'name_ro',
  en: 'name_en',
  ja: 'name_ja',
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n: i18nInstance } = useTranslation()
  const currentLang = (i18nInstance.language ?? 'ro') as Language

  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return }
    supabase
      .from('books')
      .select('*, collection:collections(*)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
        } else {
          setBook(data as Book)
        }
        setLoading(false)
      })
  }, [id])

  const nameField = NAME_FIELD[currentLang] ?? 'name_ro'

  const detailRows: { labelKey: string; value: string | number | null | undefined }[] = book
    ? [
        { labelKey: 'detail.collection', value: book.collection ? book.collection[nameField] : null },
        { labelKey: 'detail.language', value: book.language },
        { labelKey: 'detail.genre', value: book.genre },
        { labelKey: 'detail.publisher', value: book.publisher },
        { labelKey: 'detail.year', value: book.year },
        { labelKey: 'detail.isbn', value: book.isbn },
        { labelKey: 'detail.location', value: book.location },
        { labelKey: 'detail.volumes', value: book.volumes },
      ]
    : []

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/yukishor.jpeg"
            alt="CSEA Logo"
            width={32}
            height={32}
            style={{ borderRadius: '4px', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
            {t('app.title')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {LANGS.map(({ code, label }) => {
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
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '24px',
          paddingBottom: '48px',
        }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '16px 0 0 0',
            fontSize: '14px',
            color: 'var(--color-text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '24px',
          }}
        >
          <ChevronLeft size={16} />
          {t('detail.back')}
        </button>

        {/* Loading skeleton */}
        {loading && (
          <div className="skeleton" style={{ height: '200px', borderRadius: '8px', width: '100%' }} />
        )}

        {/* Not found */}
        {!loading && notFound && (
          <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', paddingTop: '48px', textAlign: 'center' }}>
            Cartea nu a fost găsită.
          </p>
        )}

        {/* Book detail */}
        {!loading && book && (
          <>
            <div
              style={{
                display: 'flex',
                gap: '32px',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              {/* Cover placeholder */}
              <div
                style={{
                  flexShrink: 0,
                  width: '140px',
                  height: '200px',
                  backgroundColor: '#EDEAE5',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={40} color="var(--color-text-muted)" />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1
                  style={{
                    fontSize: '22px',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    lineHeight: 1.3,
                    margin: '0 0 4px',
                  }}
                >
                  {book.title}
                </h1>
                <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', margin: '0 0 16px' }}>
                  {book.author}
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: book.is_available ? '#437A22' : '#964219',
                    margin: '0 0 20px',
                  }}
                >
                  {book.is_available ? t('book.available') : t('book.borrowed')}
                </p>

                {/* Details grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '8px 24px',
                    alignItems: 'start',
                  }}
                >
                  {detailRows.map(({ labelKey, value }) => (
                    value != null && value !== '' ? (
                      <Fragment key={labelKey}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--color-text-muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {t(labelKey)}
                        </span>
                        <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                          {String(value)}
                        </span>
                      </Fragment>
                    ) : null
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            {book.description && (
              <>
                <div style={{ borderTop: '1px solid var(--color-border)', margin: '24px 0' }} />
                <p style={{ fontSize: '15px', color: 'var(--color-text)', lineHeight: 1.7, margin: 0 }}>
                  {book.description}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
