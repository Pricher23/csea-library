import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Loan } from '../../types'

interface BookSearchResult {
  id: string
  title: string
  author: string
}

interface LoanWithBook extends Omit<Loan, 'book'> {
  book: { id: string; title: string; author: string } | null
}

interface LoanFormData {
  bookSearchTerm: string
  selectedBook: BookSearchResult | null
  borrowerName: string
  borrowerEmail: string
  borrowerPhone: string
  borrowerFaculty: string
  borrowerYear: string
  loanDate: string
  dueDate: string
  notes: string
}

function getEmptyForm(): LoanFormData {
  return {
    bookSearchTerm: '',
    selectedBook: null,
    borrowerName: '',
    borrowerEmail: '',
    borrowerPhone: '',
    borrowerFaculty: '',
    borrowerYear: '',
    loanDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
  }
}

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

function fieldFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--color-primary)'
}
function fieldBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--color-border)'
}

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '4px' }}>
      {text}{required && <span style={{ color: 'var(--color-error)' }}>*</span>}
    </label>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ro-RO')
}

function formatFacultyYear(faculty: string | null, year: number | null): string {
  if (!faculty && !year) return '—'
  if (faculty && year) return `${faculty}, An ${year}`
  return faculty ?? `An ${year}`
}

function isDueDateOverdue(dueDate: string | null, returnDate: string | null): boolean {
  if (!dueDate || returnDate !== null) return false
  return new Date(dueDate) < new Date()
}

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid var(--color-border)',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  backgroundColor: '#EDEAE5',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '14px',
  color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)',
  verticalAlign: 'top',
}

export default function AdminLoansPage() {
  const [activeLoans, setActiveLoans] = useState<LoanWithBook[]>([])
  const [returnedLoans, setReturnedLoans] = useState<LoanWithBook[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'returned'>('active')

  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [form, setForm] = useState<LoanFormData>(getEmptyForm())
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [returnModal, setReturnModal] = useState<{ loan: LoanWithBook; condition: string } | null>(null)
  const [returnSaving, setReturnSaving] = useState(false)
  const [returnError, setReturnError] = useState<string | null>(null)

  const fetchLoans = useCallback(async () => {
    setLoading(true)
    const [activeResult, returnedResult] = await Promise.all([
      supabase
        .from('loans')
        .select('*, book:books(id, title, author)')
        .is('return_date', null)
        .order('loan_date', { ascending: false }),
      supabase
        .from('loans')
        .select('*, book:books(id, title, author)')
        .not('return_date', 'is', null)
        .order('loan_date', { ascending: false }),
    ])
    setActiveLoans((activeResult.data as LoanWithBook[]) ?? [])
    setReturnedLoans((returnedResult.data as LoanWithBook[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  // Book search for the record modal
  useEffect(() => {
    if (!form.bookSearchTerm.trim() || form.selectedBook) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('books')
        .select('id, title, author')
        .ilike('title', `%${form.bookSearchTerm}%`)
        .eq('is_available', true)
        .limit(8)
      setSearchResults((data as BookSearchResult[]) ?? [])
    }, 250)
    return () => clearTimeout(timer)
  }, [form.bookSearchTerm, form.selectedBook])

  function setField<K extends keyof LoanFormData>(key: K, value: LoanFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleBookSearchChange(term: string) {
    setForm((prev) => ({ ...prev, bookSearchTerm: term, selectedBook: null }))
  }

  function selectBook(book: BookSearchResult) {
    setForm((prev) => ({ ...prev, selectedBook: book, bookSearchTerm: '' }))
    setSearchResults([])
  }

  function openRecordModal() {
    setForm(getEmptyForm())
    setSearchResults([])
    setSaveError(null)
    setRecordModalOpen(true)
  }

  function closeRecordModal() {
    setRecordModalOpen(false)
    setSaveError(null)
    setSearchResults([])
  }

  async function handleSaveLoan() {
    if (!form.selectedBook) return
    setSaving(true)
    setSaveError(null)

    const { error: loanError } = await supabase.from('loans').insert({
      book_id: form.selectedBook.id,
      borrower_name: form.borrowerName,
      borrower_email: form.borrowerEmail,
      borrower_phone: form.borrowerPhone.trim() || null,
      borrower_faculty: form.borrowerFaculty.trim() || null,
      borrower_year: form.borrowerYear ? parseInt(form.borrowerYear, 10) : null,
      loan_date: form.loanDate,
      due_date: form.dueDate || null,
      notes: form.notes.trim() || null,
    })

    if (loanError) {
      setSaveError('A apărut o eroare. Încearcă din nou.')
      setSaving(false)
      return
    }

    await supabase.from('books').update({ is_available: false }).eq('id', form.selectedBook.id)
    setSaving(false)
    closeRecordModal()
    fetchLoans()
  }

  function openReturnModal(loan: LoanWithBook) {
    setReturnModal({ loan, condition: '' })
    setReturnError(null)
  }

  function closeReturnModal() {
    setReturnModal(null)
    setReturnError(null)
  }

  async function handleConfirmReturn() {
    if (!returnModal) return
    setReturnSaving(true)
    setReturnError(null)

    const today = new Date().toISOString().split('T')[0]
    const { error: loanError } = await supabase
      .from('loans')
      .update({
        return_date: today,
        condition_on_return: returnModal.condition.trim() || null,
      })
      .eq('id', returnModal.loan.id)

    if (loanError) {
      setReturnError('A apărut o eroare. Încearcă din nou.')
      setReturnSaving(false)
      return
    }

    await supabase.from('books').update({ is_available: true }).eq('id', returnModal.loan.book_id)
    setReturnSaving(false)
    closeReturnModal()
    fetchLoans()
  }

  const tabStyle = (tab: 'active' | 'returned'): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: '14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '-1px',
    borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
    fontWeight: activeTab === tab ? 500 : 400,
  })

  const canSave = !!form.selectedBook && !!form.borrowerName && !!form.borrowerEmail && !!form.loanDate

  return (
    <>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Împrumuturi</h1>
        <button
          onClick={openRecordModal}
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
          Înregistrează împrumut
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
        <button style={tabStyle('active')} onClick={() => setActiveTab('active')}>Active</button>
        <button style={tabStyle('returned')} onClick={() => setActiveTab('returned')}>Returnate</button>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '48px' }}>
          Se încarcă...
        </p>
      ) : (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            {activeTab === 'active' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Carte', 'Împrumutat de', 'Contact', 'Facultate/An', 'Data împrumutului', 'Scadență', 'Acțiuni'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      style={{ backgroundColor: 'white' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9F8F5' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white' }}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{loan.book?.title ?? '—'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{loan.book?.author ?? ''}</div>
                      </td>
                      <td style={tdStyle}>
                        <div>{loan.borrower_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{loan.borrower_email}</div>
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{loan.borrower_phone ?? '—'}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        {formatFacultyYear(loan.borrower_faculty, loan.borrower_year)}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDate(loan.loan_date)}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: isDueDateOverdue(loan.due_date, loan.return_date) ? 'var(--color-error)' : 'var(--color-text)' }}>
                        {loan.due_date ? formatDate(loan.due_date) : '—'}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => openReturnModal(loan)}
                          style={{
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '13px',
                            color: 'var(--color-text)',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary)'
                            e.currentTarget.style.color = 'var(--color-primary)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border)'
                            e.currentTarget.style.color = 'var(--color-text)'
                          }}
                        >
                          Marchează returnat
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeLoans.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                        Nu există împrumuturi active.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Carte', 'Împrumutat de', 'Data împrumutului', 'Data returnării', 'Stare carte'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {returnedLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      style={{ backgroundColor: 'white' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9F8F5' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white' }}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{loan.book?.title ?? '—'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{loan.book?.author ?? ''}</div>
                      </td>
                      <td style={tdStyle}>
                        <div>{loan.borrower_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{loan.borrower_email}</div>
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDate(loan.loan_date)}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{loan.return_date ? formatDate(loan.return_date) : '—'}</td>
                      <td style={tdStyle}>{loan.condition_on_return ?? '—'}</td>
                    </tr>
                  ))}
                  {returnedLoans.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '48px 16px', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                        Nu există împrumuturi returnate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Record Loan Modal */}
      {recordModalOpen && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeRecordModal() }}
        >
          <div
            style={{ backgroundColor: 'white', borderRadius: '8px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Înregistrează împrumut</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Row 1: Book search */}
              <div>
                <FieldLabel text="Carte" required />
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Caută după titlu..."
                    value={form.selectedBook ? form.selectedBook.title : form.bookSearchTerm}
                    onChange={(e) => handleBookSearchChange(e.target.value)}
                    onFocus={fieldFocus}
                    onBlur={(e) => {
                      fieldBlur(e)
                      setTimeout(() => setSearchResults([]), 150)
                    }}
                    style={inputStyle}
                  />
                  {searchResults.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 10,
                        marginTop: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      {searchResults.map((book) => (
                        <div
                          key={book.id}
                          onMouseDown={() => selectBook(book)}
                          style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9F8F5' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white' }}
                        >
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{book.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{book.author}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {form.selectedBook && (
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-primary)' }}>
                    Carte selectată: {form.selectedBook.title}
                  </p>
                )}
              </div>

              {/* Row 2: Borrower name + email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <FieldLabel text="Nume împrumutat" required />
                  <input type="text" value={form.borrowerName} onChange={(e) => setField('borrowerName', e.target.value)} style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                </div>
                <div>
                  <FieldLabel text="Email" required />
                  <input type="email" value={form.borrowerEmail} onChange={(e) => setField('borrowerEmail', e.target.value)} style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                </div>
              </div>

              {/* Row 3: Phone + Faculty */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <FieldLabel text="Telefon" />
                  <input type="text" value={form.borrowerPhone} onChange={(e) => setField('borrowerPhone', e.target.value)} style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                </div>
                <div>
                  <FieldLabel text="Facultate" />
                  <input type="text" value={form.borrowerFaculty} onChange={(e) => setField('borrowerFaculty', e.target.value)} style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                </div>
              </div>

              {/* Row 4: Year of study + Loan date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <FieldLabel text="An de studiu" />
                  <input type="number" min={1} max={6} value={form.borrowerYear} onChange={(e) => setField('borrowerYear', e.target.value)} style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                </div>
                <div>
                  <FieldLabel text="Data împrumutului" required />
                  <input type="date" value={form.loanDate} onChange={(e) => setField('loanDate', e.target.value)} style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
                </div>
              </div>

              {/* Row 5: Due date */}
              <div>
                <FieldLabel text="Scadență" />
                <input type="date" value={form.dueDate} onChange={(e) => setField('dueDate', e.target.value)} style={inputStyle} onFocus={fieldFocus} onBlur={fieldBlur} />
              </div>

              {/* Row 6: Notes */}
              <div>
                <FieldLabel text="Observații" />
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '14px', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                  onFocus={fieldFocus}
                  onBlur={fieldBlur}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={closeRecordModal}
                disabled={saving}
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'white', color: 'var(--color-text)', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', cursor: saving ? 'default' : 'pointer' }}
              >
                Anulează
              </button>
              <button
                onClick={handleSaveLoan}
                disabled={saving || !canSave}
                style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', fontWeight: 500, cursor: saving || !canSave ? 'default' : 'pointer', opacity: saving || !canSave ? 0.7 : 1 }}
                onMouseEnter={(e) => { if (!saving && canSave) e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)' }}
                onMouseLeave={(e) => { if (!saving && canSave) e.currentTarget.style.backgroundColor = 'var(--color-primary)' }}
              >
                {saving ? 'Se salvează...' : 'Salvează'}
              </button>
            </div>
            {saveError && (
              <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-error)', textAlign: 'right' }}>{saveError}</p>
            )}
          </div>
        </div>
      )}

      {/* Mark as Returned Modal */}
      {returnModal && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeReturnModal() }}
        >
          <div
            style={{ backgroundColor: 'white', borderRadius: '8px', padding: '32px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px' }}>Marchează ca returnat</h2>

            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 16px' }}>
              <strong style={{ color: 'var(--color-text)' }}>{returnModal.loan.book?.title ?? '—'}</strong>
              {' — '}
              {returnModal.loan.borrower_name}
            </p>

            <div>
              <FieldLabel text="Starea cărții" />
              <textarea
                rows={3}
                value={returnModal.condition}
                onChange={(e) => setReturnModal((prev) => prev ? { ...prev, condition: e.target.value } : prev)}
                placeholder="Opțional"
                style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '14px', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                onFocus={fieldFocus}
                onBlur={fieldBlur}
              />
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={closeReturnModal}
                disabled={returnSaving}
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'white', color: 'var(--color-text)', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', cursor: returnSaving ? 'default' : 'pointer' }}
              >
                Anulează
              </button>
              <button
                onClick={handleConfirmReturn}
                disabled={returnSaving}
                style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', fontWeight: 500, cursor: returnSaving ? 'default' : 'pointer', opacity: returnSaving ? 0.7 : 1 }}
                onMouseEnter={(e) => { if (!returnSaving) e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)' }}
                onMouseLeave={(e) => { if (!returnSaving) e.currentTarget.style.backgroundColor = 'var(--color-primary)' }}
              >
                {returnSaving ? 'Se procesează...' : 'Confirmă'}
              </button>
            </div>
            {returnError && (
              <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-error)', textAlign: 'right' }}>{returnError}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
