import { useState, useRef, useCallback } from 'react'
import Papa from 'papaparse'
import { Download, Upload, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const CSV_COLUMNS = 'title,author,isbn,publisher,year,language,genre,volumes,location,collection,description'

const TEMPLATE_ROWS = [
  '"Japoneza pentru începători","Matsuura Kenji","","Humanitas","2018","Japanese","Grammar","1","Room P08 Shelf 1","Niponologie","Introducere în gramatica japoneză"',
  '"Kokoro","Natsume Soseki","9789731369","Polirom","2005","Romanian","Literature","2","Room P08 Shelf 2","Donații",""',
]

interface CsvRow {
  title?: string
  author?: string
  isbn?: string
  publisher?: string
  year?: string
  language?: string
  genre?: string
  volumes?: string
  location?: string
  collection?: string
  description?: string
}

interface ParsedRow {
  raw: CsvRow
  index: number
  isValid: boolean
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  padding: '24px',
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
  padding: '10px 16px',
  fontSize: '14px',
  color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)',
  whiteSpace: 'nowrap',
}

function downloadTemplate() {
  const content = [CSV_COLUMNS, ...TEMPLATE_ROWS].join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sablon-carti.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export default function AdminImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; count: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const parseFile = useCallback((file: File) => {
    setSelectedFile(file)
    setImportResult(null)
    setImportError(null)
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = results.data.slice(0, 50).map((raw, index) => ({
          raw,
          index: index + 1,
          isValid: !!raw.title?.trim() && !!raw.author?.trim(),
        }))
        setParsedRows(rows)
      },
    })
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) parseFile(file)
  }

  function clearFile() {
    setSelectedFile(null)
    setParsedRows([])
    setImportResult(null)
    setImportError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validRows = parsedRows.filter((r) => r.isValid)
  const invalidRows = parsedRows.filter((r) => !r.isValid)

  async function handleImport() {
    if (validRows.length === 0) return
    setImporting(true)
    setImportError(null)

    const books = validRows.map((r) => ({
      title: r.raw.title!.trim(),
      author: r.raw.author!.trim(),
      isbn: r.raw.isbn?.trim() || null,
      publisher: r.raw.publisher?.trim() || null,
      year: r.raw.year ? parseInt(r.raw.year, 10) || null : null,
      language: r.raw.language?.trim() || 'Romanian',
      genre: r.raw.genre?.trim() || null,
      volumes: r.raw.volumes ? parseInt(r.raw.volumes, 10) || 1 : 1,
      location: r.raw.location?.trim() || '',
      description: r.raw.description?.trim() || null,
      is_available: true,
      collection_id: null,
    }))

    const BATCH_SIZE = 50
    let hasError = false

    for (let i = 0; i < books.length; i += BATCH_SIZE) {
      const batch = books.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('books').insert(batch)
      if (error) {
        hasError = true
        break
      }
    }

    setImporting(false)

    if (hasError) {
      setImportError('A apărut o eroare la import. Unele cărți nu au fost adăugate.')
    } else {
      setImportResult({ success: true, count: books.length })
      clearFile()
    }
  }

  const dropZoneStyle: React.CSSProperties = {
    border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
    borderRadius: '8px',
    padding: '40px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: dragOver ? '#F7FAFA' : 'white',
    transition: 'border-color 0.15s, background-color 0.15s',
  }

  return (
    <div>
      {/* Page header */}
      <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>Import CSV</h1>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 32px' }}>
        Importă cărți din fișier CSV în baza de date.
      </p>

      {/* Section 1: Template */}
      <div style={{ ...cardStyle, marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>
          Format CSV acceptat
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 16px' }}>
          Fișierul CSV trebuie să conțină exact următoarele coloane în această ordine. Descarcă
          șablonul de mai jos și completează-l cu datele cărților.
        </p>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '13px',
            backgroundColor: '#F3F0EC',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '16px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {CSV_COLUMNS}
        </div>
        <button
          onClick={downloadTemplate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'white',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            color: 'var(--color-primary)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
        >
          <Download size={16} />
          Descarcă șablon
        </button>
      </div>

      {/* Section 2: Upload */}
      <div style={{ ...cardStyle, marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px' }}>
          Încarcă fișier CSV
        </h2>
        <div
          style={dropZoneStyle}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload size={32} color="var(--color-text-muted)" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 4px' }}>
            Trage fișierul CSV aici sau{' '}
            <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>alege fișier</span>
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {selectedFile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {selectedFile.name} — {formatBytes(selectedFile.size)}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); clearFile() }}
              style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Section 3: Preview */}
      {parsedRows.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '14px', margin: '0 0 12px' }}>
            <span style={{ color: '#437A22', fontWeight: 500 }}>{validRows.length} rânduri valide</span>
            {invalidRows.length > 0 && (
              <>
                {', '}
                <span style={{ color: 'var(--color-error)', fontWeight: 500 }}>{invalidRows.length} rânduri cu erori</span>
              </>
            )}
          </p>
          <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#', 'Titlu', 'Autor', 'Limbă', 'Gen', 'Locație', 'Colecție', 'Status'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row) => (
                    <tr
                      key={row.index}
                      style={{ backgroundColor: row.isValid ? 'white' : '#FDF2F2' }}
                    >
                      <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{row.index}</td>
                      <td style={{ ...tdStyle, fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.raw.title || '—'}
                      </td>
                      <td style={tdStyle}>{row.raw.author || '—'}</td>
                      <td style={tdStyle}>{row.raw.language || '—'}</td>
                      <td style={tdStyle}>{row.raw.genre || '—'}</td>
                      <td style={tdStyle}>{row.raw.location || '—'}</td>
                      <td style={tdStyle}>{row.raw.collection || '—'}</td>
                      <td style={tdStyle}>
                        {row.isValid ? (
                          <span style={{ color: '#437A22', fontWeight: 500, fontSize: '13px' }}>✓ Valid</span>
                        ) : (
                          <span style={{ color: 'var(--color-error)', fontWeight: 500, fontSize: '13px' }}>✗ Lipsește titlu/autor</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Import result */}
      {importResult?.success && (
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: '#437A22' }}>
            Import finalizat. {importResult.count} cărți adăugate cu succes.
          </p>
        </div>
      )}
      {importError && (
        <p style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--color-error)' }}>
          {importError}
        </p>
      )}

      {/* Section 4: Action buttons */}
      {parsedRows.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={clearFile}
            disabled={importing}
            style={{
              border: '1px solid var(--color-border)',
              backgroundColor: 'white',
              color: 'var(--color-text)',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: importing ? 'default' : 'pointer',
            }}
            onMouseEnter={(e) => { if (!importing) e.currentTarget.style.borderColor = 'var(--color-primary)' }}
            onMouseLeave={(e) => { if (!importing) e.currentTarget.style.borderColor = 'var(--color-border)' }}
          >
            Resetează
          </button>
          <button
            onClick={handleImport}
            disabled={importing || validRows.length === 0}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: importing || validRows.length === 0 ? 'default' : 'pointer',
              opacity: importing || validRows.length === 0 ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { if (!importing && validRows.length > 0) e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)' }}
            onMouseLeave={(e) => { if (!importing && validRows.length > 0) e.currentTarget.style.backgroundColor = 'var(--color-primary)' }}
          >
            {importing ? 'Se importă...' : `Importă ${validRows.length} cărți`}
          </button>
        </div>
      )}
    </div>
  )
}
