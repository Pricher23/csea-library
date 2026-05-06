import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Stats {
  totalBooks: number
  availableBooks: number
  activeLoans: number
  overdueLoans: number
}

interface RecentLoan {
  id: string
  borrower_name: string
  loan_date: string
  book: { title: string; author: string } | null
}

interface CollectionWithCount {
  id: string
  name_ro: string
  books: { count: number }[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ro-RO')
}

function StatSkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '20px 24px',
      }}
    >
      <div className="skeleton" style={{ height: '12px', width: '55%', marginBottom: '14px' }} />
      <div className="skeleton" style={{ height: '36px', width: '35%' }} />
    </div>
  )
}

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string
  value: number
  valueColor?: string
}) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 600,
          color: valueColor ?? 'var(--color-text)',
          lineHeight: 1.2,
          marginTop: '8px',
        }}
      >
        {value}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentLoans, setRecentLoans] = useState<RecentLoan[]>([])
  const [collections, setCollections] = useState<CollectionWithCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]

    Promise.all([
      supabase.from('books').select('*', { count: 'exact', head: true }),
      supabase.from('books').select('*', { count: 'exact', head: true }).eq('is_available', true),
      supabase.from('loans').select('*', { count: 'exact', head: true }).is('return_date', null),
      supabase.from('loans').select('*', { count: 'exact', head: true }).is('return_date', null).lt('due_date', today),
      supabase.from('loans').select('*, book:books(title, author)').is('return_date', null).order('created_at', { ascending: false }).limit(5),
      supabase.from('collections').select('*, books(count)'),
    ]).then(([totalRes, availRes, activeRes, overdueRes, loansRes, collectionsRes]) => {
      setStats({
        totalBooks: totalRes.count ?? 0,
        availableBooks: availRes.count ?? 0,
        activeLoans: activeRes.count ?? 0,
        overdueLoans: overdueRes.count ?? 0,
      })
      setRecentLoans((loansRes.data as RecentLoan[]) ?? [])
      setCollections((collectionsRes.data as CollectionWithCount[]) ?? [])
      setLoading(false)
    })
  }, [])

  const STAT_CARDS = stats
    ? [
        { label: 'Total cărți', value: stats.totalBooks },
        { label: 'Disponibile', value: stats.availableBooks },
        { label: 'Împrumutate', value: stats.activeLoans },
        {
          label: 'Restanțe',
          value: stats.overdueLoans,
          valueColor: stats.overdueLoans > 0 ? 'var(--color-error)' : undefined,
        },
      ]
    : null

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 24px' }}>
        Dashboard
      </h1>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeletonCard key={i} />)
          : STAT_CARDS!.map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                valueColor={card.valueColor}
              />
            ))}
      </div>

      {/* Recent loans */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px' }}>
          Împrumuturi recente
        </h2>
        {!loading && recentLoans.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', padding: '24px 0', textAlign: 'center' }}>
            Nu există împrumuturi active.
          </p>
        ) : (
          <div>
            {recentLoans.map((loan, idx) => (
              <div
                key={loan.id}
                style={{
                  padding: '12px 0',
                  borderBottom: idx < recentLoans.length - 1 ? '1px solid var(--color-border)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                    {loan.book?.title ?? '—'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {loan.borrower_name}
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', flexShrink: 0, marginLeft: '16px' }}>
                  {formatDate(loan.loan_date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collections summary */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px' }}>
          Cărți pe colecții
        </h2>
        {!loading && collections.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', padding: '24px 0', textAlign: 'center' }}>
            Nu există colecții.
          </p>
        ) : (
          <div>
            {collections.map((col, idx) => (
              <div
                key={col.id}
                style={{
                  padding: '12px 0',
                  borderBottom: idx < collections.length - 1 ? '1px solid var(--color-border)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                  {col.name_ro}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                  {col.books[0]?.count ?? 0} cărți
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
