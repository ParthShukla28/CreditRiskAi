
import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { loanService } from '../services/loanService'
import type { Page, ToastMsg } from '../App'

const C = {
  void:     '#FFFFFF',
  surface:  '#FFFFFF',
  elevated: '#F8FAFC',
  border:   '#E2E8F0',
  text:     '#0F172A',
  textSub:  '#334155',
  textMute: '#94A3B8',
  textDim:  '#CBD5E1',
  blue:     '#2563EB',
  blueSoft: '#60A5FA',
  green:    '#059669',
  amber:    '#D97706',
  red:      '#DC2626',
  mono:     "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  sans:     "'Inter', system-ui, sans-serif",
}

const card: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  padding: '9px 12px',
  fontSize: 13,
  color: C.textSub,
  background: C.surface,
  fontFamily: C.sans,
  outline: 'none',
}

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)

interface Props {
  navigate: (page: Page, loanId?: string) => void
  showToast: (msg: string, type?: ToastMsg['type']) => void
}

interface Applicant { fullName?: string; email?: string }
interface RiskAssessment { riskCategory?: string; riskScore?: number }
interface LoanRow {
  _id: string
  loanAmount: number
  intRate: number
  status: string
  createdAt: string
  applicant?: Applicant
  riskAssessment?: RiskAssessment | null
}

function RiskBadge({ level }: { level?: string }) {
  const map: Record<string, string> = {
    low:    C.green,
    medium: C.amber,
    high:   C.red,
  }
  const color = map[level?.toLowerCase() ?? ''] ?? C.textMute
  return (
    <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize', color }}>
      {level || 'N/A'}
    </span>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const s = status?.toLowerCase() ?? ''
  let color = C.textSub
  if (s === 'approved')                                                color = C.green
  else if (s === 'rejected')                                           color = C.red
  else if (s === 'pending' || s === 'pending_review' || s === 'under_review') color = C.amber
  return (
    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize', color }}>
      {status?.replace('_', ' ') || '—'}
    </span>
  )
}

type SortField = 'createdAt' | 'loanAmount' | 'intRate'

export default function LoanApplicantsPage({ navigate, showToast }: Props) {
  const [loans, setLoans]           = useState<LoanRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(false)
  const [search, setSearch]         = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]             = useState(1)
  const [limit, setLimit]           = useState(10)
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy]         = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder]   = useState<'asc' | 'desc'>('desc')

  const fetchLoans = useCallback(async () => {
    setLoading(true)
    try {
      const data = await loanService.getLoans({
        search, status: statusFilter, riskLevel: riskFilter,
        page, limit, sortBy, sortOrder,
      })
      setLoans(data.loans)
      setTotal(data.pagination.total)
      setTotalPages(data.pagination.totalPages)
      setError(false)
    } catch {
      setError(true)
      showToast('Failed to load applications', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, riskFilter, page, limit, sortBy, sortOrder, showToast])

  useEffect(() => {
    const t = setTimeout(fetchLoans, 300)
    return () => clearTimeout(t)
  }, [fetchLoans])

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const SortIcon = ({ field }: { field: SortField }) => (
    <span style={{ marginLeft: 4, display: 'inline-flex', flexDirection: 'column', verticalAlign: 'middle' }}>
      <ChevronUp
        style={{ width: 11, height: 11, marginBottom: -3 }}
        color={sortBy === field && sortOrder === 'asc' ? C.blue : C.textDim}
      />
      <ChevronDown
        style={{ width: 11, height: 11 }}
        color={sortBy === field && sortOrder === 'desc' ? C.blue : C.textDim}
      />
    </span>
  )

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const columns: { label: string; sortable: boolean; field?: SortField }[] = [
    { label: 'Applicant',     sortable: false },
    { label: 'Loan amount',   sortable: true,  field: 'loanAmount' },
    { label: 'Interest rate', sortable: true,  field: 'intRate' },
    { label: 'Risk level',    sortable: false },
    { label: 'Risk score',    sortable: false },
    { label: 'Status',        sortable: false },
    { label: 'Date',          sortable: true,  field: 'createdAt' },
    { label: '',              sortable: false },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.void, fontFamily: C.sans, color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        .tbl-row:hover td { background: rgba(37,99,235,0.03) !important; }
        .tbl-action {
          font-size: 12px; font-weight: 600; color: ${C.blue};
          background: none; border: none; cursor: pointer; padding: 0;
          display: inline-flex; align-items: center; gap: 4px;
          transition: opacity .15s;
        }
        .tbl-action:hover { opacity: .7; }
        .pg-btn {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 6px;
          border: 1px solid ${C.border}; background: ${C.surface};
          color: ${C.textMute}; cursor: pointer; transition: background .15s;
          font-family: ${C.mono}; font-size: 12px; font-weight: 600;
        }
        .pg-btn:hover:not(:disabled) { background: ${C.elevated}; }
        .pg-btn:disabled { opacity: .4; cursor: not-allowed; }
        .pg-btn.active { background: ${C.blue}; border-color: ${C.blue}; color: #fff; }
        .sortable-th { cursor: pointer; user-select: none; transition: color .15s; }
        .sortable-th:hover { color: ${C.textSub} !important; }
        input::placeholder { color: ${C.textMute}; }
        .filter-input:focus, .filter-select:focus { border-color: ${C.blue} !important; }
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: 1440, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Loan applicants</h1>
          <p style={{ fontSize: 13, color: C.textMute, margin: 0 }}>
            {total > 0 ? `${total.toLocaleString('en-IN')} application${total !== 1 ? 's' : ''} total` : 'All submitted loan applications'}
          </p>
        </div>

        <div style={{
          ...card, padding: 16, marginBottom: 20,
          display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
        }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search style={{
              position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
              width: 15, height: 15, color: C.textMute,
            }} />
            <input
              type="text"
              placeholder="Search by applicant name…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="filter-input"
              style={{ ...inputStyle, width: '100%', paddingLeft: 34 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter style={{ width: 14, height: 14, color: C.textMute }} />
            <select
              value={riskFilter}
              onChange={e => { setRiskFilter(e.target.value); setPage(1) }}
              className="filter-select"
              style={inputStyle}
            >
              <option value="">All risk levels</option>
              <option value="low">Low risk</option>
              <option value="medium">Medium risk</option>
              <option value="high">High risk</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="filter-select"
            style={inputStyle}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="under_review">Under review</option>
          </select>

          <select
            value={limit}
            onChange={e => { setLimit(Number(e.target.value)); setPage(1) }}
            className="filter-select"
            style={inputStyle}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>

        <div style={{ ...card, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, gap: 12 }}>
              <div style={{
                width: 20, height: 20, border: `2px solid ${C.border}`,
                borderTop: `2px solid ${C.blue}`, borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              <span style={{ fontFamily: C.mono, fontSize: 12, color: C.textMute, letterSpacing: '0.08em' }}>
                LOADING
              </span>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '64px 24px' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.textSub, margin: '0 0 4px' }}>
                Couldn't load applications
              </p>
              <p style={{ fontSize: 12, color: C.textMute, margin: 0 }}>
                Please refresh the page or try again later.
              </p>
            </div>
          ) : loans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px' }}>
              <Search style={{ width: 32, height: 32, color: C.textDim, margin: '0 auto 12px' }} />
              <p style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.textMute, textTransform: 'uppercase', margin: '0 0 6px' }}>
                No applications found
              </p>
              <p style={{ fontSize: 12, color: C.textMute, margin: 0 }}>Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.elevated }}>
                      {columns.map(col => (
                        <th
                          key={col.label || 'action'}
                          className={col.sortable ? 'sortable-th' : ''}
                          onClick={() => col.sortable && col.field && handleSort(col.field)}
                          style={{
                            padding: '10px 20px', textAlign: 'left',
                            fontSize: 10, fontWeight: 700, color: C.textMute,
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            fontFamily: C.mono, whiteSpace: 'nowrap',
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          {col.label}
                          {col.sortable && col.field && <SortIcon field={col.field} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map(loan => {
                      const risk = loan.riskAssessment
                      const raw = risk?.riskScore
                      const score = raw != null ? (raw < 1 ? Math.round(raw * 100) : Math.round(raw)) : null
                      return (
                        <tr key={loan._id} className="tbl-row">
                          <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px' }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: '0 0 2px' }}>
                              {loan.applicant?.fullName || 'Unknown'}
                            </p>
                            <p style={{ fontSize: 11, color: C.textMute, margin: 0 }}>{loan.applicant?.email}</p>
                          </td>
                          <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px', fontFamily: C.mono, fontSize: 12, fontWeight: 600, color: C.textSub }}>
                            {formatINR(Number(loan.loanAmount))}
                          </td>
                          <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px', fontFamily: C.mono, fontSize: 12, color: C.textSub }}>
                            {Number(loan.intRate).toFixed(1)}%
                          </td>
                          <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px' }}>
                            <RiskBadge level={risk?.riskCategory} />
                          </td>
                          <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px' }}>
                            {score != null
                              ? <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: C.textSub }}>{score}</span>
                              : <span style={{ color: C.textMute, fontSize: 13 }}>—</span>
                            }
                          </td>
                          <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px' }}>
                            <StatusBadge status={loan.status} />
                          </td>
                          <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px', fontFamily: C.mono, fontSize: 12, color: C.textMute }}>
                            {formatDate(loan.createdAt)}
                          </td>
                          <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px' }}>
                            <button className="tbl-action" onClick={() => navigate('details', loan._id)}>
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderTop: `1px solid ${C.border}`, background: C.elevated,
              }}>
                <p style={{ fontSize: 12, color: C.textMute, margin: 0, fontFamily: C.mono }}>
                  Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total).toLocaleString('en-IN')} of {total.toLocaleString('en-IN')}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    className="pg-btn"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft style={{ width: 14, height: 14 }} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pg = i + 1
                    return (
                      <button
                        key={pg}
                        className={`pg-btn ${page === pg ? 'active' : ''}`}
                        onClick={() => setPage(pg)}
                      >
                        {pg}
                      </button>
                    )
                  })}
                  <button
                    className="pg-btn"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPages || totalPages === 0}
                    aria-label="Next page"
                  >
                    <ChevronRight style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}