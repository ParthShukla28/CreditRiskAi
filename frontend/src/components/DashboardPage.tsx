import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import { analyticsService, loanService } from '../services/loanService'
import type { Page, ToastMsg } from '../App'
import LoanAdvisorChat from './LoanAdvisorChat'

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
  greenBg:  '#ECFDF5',
  amber:    '#D97706',
  amberBg:  '#FFFBEB',
  red:      '#DC2626',
  redBg:    '#FEF2F2',
  mono:     "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  sans:     "'Inter', system-ui, sans-serif",
}

const card: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
}

const cardHead: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: `1px solid ${C.border}`,
}

const sectionEye: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: C.blue,
  margin: '0 0 12px',
}

const tooltipStyle = {
  contentStyle: {
    background: '#FFFFFF',
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    fontSize: 12,
    color: C.textSub,
    fontFamily: C.mono,
    boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
  },
  labelStyle: { color: C.textMute, fontSize: 11 },
  itemStyle: { color: C.textSub },
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

interface OverviewMetric { value: number; change?: number }
interface RiskSlice { name: string; count: number; color: string }
interface TrendPoint { month: string; total: number }
interface RiskAssessment { riskCategory?: string; riskScore?: number }
interface Applicant { fullName?: string; email?: string }
interface LoanRecord {
  _id: string
  loanAmount: number
  status: string
  applicant?: Applicant
  riskAssessment?: RiskAssessment | null
}

function RiskBadge({ level }: { level?: string }) {
  const map: Record<string, string> = {
    low: C.green, medium: C.amber, high: C.red,
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
  if (s === 'approved')                               color = C.green
  else if (s === 'rejected')                          color = C.red
  else if (s === 'pending' || s === 'pending_review') color = C.amber
  return (
    <span style={{
      fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
      letterSpacing: '0.02em', color,
    }}>
      {status?.replace('_', ' ') || '—'}
    </span>
  )
}

function CardHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={cardHead}>
      <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: '0 0 2px' }}>{title}</p>
      <p style={{ fontSize: 11, color: C.textMute, margin: 0 }}>{sub}</p>
    </div>
  )
}

function EmptyState({ label, height = 180 }: { label: string; height?: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height, color: C.textDim, fontSize: 12, fontFamily: C.mono, letterSpacing: '0.05em',
    }}>
      {label}
    </div>
  )
}

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number
}) => {
  if (percent < 0.06) return null
  const R = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  return (
    <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)}
      fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={12} fontWeight={700} fontFamily={C.mono}>
      {`${Math.round(percent * 100)}%`}
    </text>
  )
}

interface Kpi { label: string; value: string | number; valueSuffix?: string; color: string }

function KpiCell({ kpi, last }: { kpi: Kpi; last: boolean }) {
  return (
    <div className="cmd-kpi" style={{ padding: '20px 28px', borderRight: last ? 'none' : `1px solid ${C.border}` }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textMute, margin: '0 0 8px' }}>
        {kpi.label}
      </p>
      <p style={{ fontFamily: C.mono, fontSize: 26, fontWeight: 700, color: kpi.color, lineHeight: 1, margin: 0 }}>
        {kpi.value}
        {kpi.valueSuffix && <span style={{ fontSize: 14, color: C.textMute, fontWeight: 400 }}>{kpi.valueSuffix}</span>}
      </p>
    </div>
  )
}

function SearchResultRow({ loan, onView }: { loan: LoanRecord; onView: () => void }) {
  const risk  = loan.riskAssessment
  const raw   = risk?.riskScore
  const score = raw != null ? Math.round(raw) : null
  return (
    <div className="search-result-row" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 16px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', transition: 'background .12s',
    }} onClick={onView}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {loan.applicant?.fullName || 'Unknown'}
        </p>
        <p style={{ fontSize: 11, color: C.textMute, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {loan.applicant?.email}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, marginLeft: 12 }}>
        <span style={{ fontFamily: C.mono, fontSize: 12, fontWeight: 600, color: C.textSub }}>{formatINR(Number(loan.loanAmount))}</span>
        {score != null && <span style={{ fontFamily: C.mono, fontSize: 12, fontWeight: 700, color: C.textMute }}>{score}</span>}
        <RiskBadge level={risk?.riskCategory} />
        <StatusBadge status={loan.status} />
        <button className="tbl-action" onClick={e => { e.stopPropagation(); onView() }}
          style={{ fontSize: 12, fontWeight: 600, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          View →
        </button>
      </div>
    </div>
  )
}

interface ToolbarProps {
  onSearch: (name: string) => void; onSaveReport: () => void
  searchValue: string; onSearchChange: (v: string) => void
  searching: boolean; searchResults: LoanRecord[] | null
  onSelectResult: (loanId: string) => void; onClearResults: () => void; saving: boolean
}

function Toolbar({ onSearch, onSaveReport, searchValue, onSearchChange, searching, searchResults, onSelectResult, onClearResults, saving }: ToolbarProps) {
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) onSearch(searchValue.trim())
    if (e.key === 'Escape') onClearResults()
  }
  const hasResults   = searchResults !== null
  const noResults    = hasResults && searchResults.length === 0
  const showDropdown = hasResults && searchValue.trim().length > 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <div style={{
          display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`,
          borderRadius: showDropdown ? '8px 8px 0 0' : 8, background: C.surface,
          overflow: 'hidden', transition: 'border-color .15s, box-shadow .15s',
        }}
          onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.blue; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 3px rgba(37,99,235,0.1)` }}
          onBlurCapture={e => { setTimeout(() => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }, 150) }}
        >
          <span style={{ padding: '0 12px', color: C.textMute, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 10L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <input type="text" placeholder="Search by applicant name…" value={searchValue}
            onChange={e => { onSearchChange(e.target.value); if (!e.target.value.trim()) onClearResults() }}
            onKeyDown={handleKey}
            style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 0', fontSize: 13, fontFamily: C.sans, color: C.text, background: 'transparent' }}
          />
          {searchValue && (
            <button onClick={() => { onSearchChange(''); onClearResults() }}
              style={{ padding: '0 10px', color: C.textMute, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center' }}>
              ×
            </button>
          )}
          <button onClick={() => searchValue.trim() && onSearch(searchValue.trim())} disabled={!searchValue.trim() || searching}
            style={{
              padding: '0 16px', height: 40,
              background: searchValue.trim() ? C.blue : C.elevated,
              color: searchValue.trim() ? '#fff' : C.textMute,
              border: 'none', borderLeft: `1px solid ${C.border}`,
              cursor: searchValue.trim() ? 'pointer' : 'default',
              fontSize: 12, fontWeight: 700, fontFamily: C.sans,
              letterSpacing: '0.04em', transition: 'background .15s, color .15s', whiteSpace: 'nowrap',
            }}>
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>
        {showDropdown && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, background: C.surface,
            border: `1px solid ${C.blue}`, borderTop: 'none', borderRadius: '0 0 8px 8px',
            boxShadow: '0 8px 24px rgba(15,23,42,0.10)', zIndex: 100, overflow: 'hidden',
          }}>
            {searching ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}>
                <div style={{ width: 14, height: 14, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.blue}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: C.textMute, fontFamily: C.mono }}>Searching…</span>
              </div>
            ) : noResults ? (
              <div style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: 12, color: C.textMute, margin: 0, fontFamily: C.mono, letterSpacing: '0.04em' }}>No applicants found for "{searchValue}"</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '8px 16px 6px', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textMute, fontFamily: C.mono }}>
                    {searchResults!.length} result{searchResults!.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {searchResults!.map(loan => (
                  <SearchResultRow key={loan._id} loan={loan} onView={() => { onSelectResult(loan._id); onClearResults() }} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
      <button onClick={onSaveReport} disabled={saving} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', height: 40,
        background: C.surface, color: saving ? C.textMute : C.textSub, border: `1px solid ${C.border}`,
        borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
        fontFamily: C.sans, transition: 'border-color .15s, background .15s, color .15s',
        whiteSpace: 'nowrap', opacity: saving ? 0.7 : 1,
      }}
        onMouseEnter={e => { if (saving) return; (e.currentTarget as HTMLButtonElement).style.borderColor = C.blue; (e.currentTarget as HTMLButtonElement).style.color = C.blue; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(37,99,235,0.04)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = saving ? C.textMute : C.textSub; (e.currentTarget as HTMLButtonElement).style.background = C.surface }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {saving ? 'Saving…' : 'Save Report'}
      </button>
    </div>
  )
}

export default function DashboardPage({ navigate, showToast }: Props) {
  const [overview, setOverview] = useState<Record<string, OverviewMetric>>({})
  const [riskDist, setRiskDist] = useState<RiskSlice[]>([
    { name: 'Low',    count: 0, color: C.green },
    { name: 'Medium', count: 0, color: C.amber },
    { name: 'High',   count: 0, color: C.red },
  ])
  const [trends, setTrends]   = useState<TrendPoint[]>([])
  const [recent, setRecent]   = useState<LoanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  const [searchName, setSearchName]       = useState('')
  const [searching, setSearching]         = useState(false)
  const [searchResults, setSearchResults] = useState<LoanRecord[] | null>(null)
  const [saving, setSaving]               = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [ov, rd, tr, rec] = await Promise.all([
          analyticsService.getOverview(),
          analyticsService.getRiskDistribution(),
          analyticsService.getTrends(),
          analyticsService.getRecent(),
        ])
        if (!mounted) return
        setOverview(ov)
        setRiskDist([
          { name: 'Low',    count: Number(rd.low)    || 0, color: C.green },
          { name: 'Medium', count: Number(rd.medium) || 0, color: C.amber },
          { name: 'High',   count: Number(rd.high)   || 0, color: C.red },
        ])
        setTrends(tr as TrendPoint[])
        setRecent(Array.isArray(rec) ? rec as LoanRecord[] : [])
      } catch {
        if (!mounted) return
        setError(true)
        showToast('Failed to load dashboard data', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [showToast])

  const handleSearch = async (name: string) => {
    setSearching(true)
    try {
      const data = await loanService.getLoans({ search: name, page: 1, limit: 8, sortBy: 'createdAt', sortOrder: 'desc' })
      setSearchResults(Array.isArray(data.loans) ? data.loans as LoanRecord[] : [])
    } catch {
      showToast('Search failed', 'error')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSaveReport = async () => {
    setSaving(true)
    try {
      await analyticsService.exportData()
      showToast('Report saved', 'success')
    } catch {
      showToast('Failed to save report', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.void, gap: 12 }}>
        <div style={{ width: 20, height: 20, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.blue}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <span style={{ fontFamily: C.mono, fontSize: 12, color: C.textMute, letterSpacing: '0.08em' }}>LOADING</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.void, gap: 8, fontFamily: C.sans }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.textSub, margin: 0 }}>Couldn't load dashboard data</p>
        <p style={{ fontSize: 12, color: C.textMute, margin: 0 }}>Please refresh the page or try again later.</p>
      </div>
    )
  }

  const totalApps    = overview.totalApplications?.value ?? 0
  const pendingCount = overview.pendingReviews?.value    ?? 0
  const approvalRate = overview.approvalRate?.value      ?? 0
  const avgScoreRaw  = overview.averageRiskScore?.value  ?? 0
  const normScore    = Math.round(avgScoreRaw)

  const decidedCount  = totalApps - pendingCount
  const approvedCount = Math.round(decidedCount * (approvalRate / 100))
  const rejectedCount = decidedCount - approvedCount

  const totalRisk = riskDist.reduce((s, d) => s + d.count, 0)
  const hasRisk   = totalRisk > 0 && riskDist.some(d => d.count > 0)
  const hasTrends = trends.some(t => t.total > 0)

  const kpis: Kpi[] = [
    { label: 'Total applications', value: totalApps.toLocaleString('en-IN'),    color: C.text  },
    { label: 'Pending reviews',    value: pendingCount.toLocaleString('en-IN'), color: C.amber },
    { label: 'Approval rate',      value: `${approvalRate}%`,                   color: C.green },
    { label: 'Avg risk score',     value: normScore, valueSuffix: '/100',
      color: normScore >= 66 ? C.red : normScore >= 33 ? C.amber : C.green },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.void, fontFamily: C.sans, color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        .tbl-row:hover td { background: rgba(37,99,235,0.03) !important; }
        .cmd-kpi { transition: background .15s; }
        .cmd-kpi:hover { background: rgba(37,99,235,0.02); }
        .view-btn, .tbl-action { font-size: 12px; font-weight: 600; color: ${C.blue}; background: none; border: none; cursor: pointer; padding: 0; transition: opacity .15s; }
        .view-btn:hover, .tbl-action:hover { opacity: .7; }
        .search-result-row:hover { background: rgba(37,99,235,0.03); }
        .search-result-row:last-child { border-bottom: none !important; }
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: 1440, margin: '0 auto' }}>

        <Toolbar
          searchValue={searchName} onSearchChange={setSearchName} onSearch={handleSearch}
          onSaveReport={handleSaveReport} searching={searching} searchResults={searchResults}
          onSelectResult={id => navigate('details', id)} onClearResults={() => setSearchResults(null)} saving={saving}
        />

        <p style={sectionEye}>Portfolio overview</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 20,
          marginBottom: 28,
          alignItems: 'stretch',
        }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', overflow: 'hidden' }}>
              {kpis.map((kpi, i) => <KpiCell key={kpi.label} kpi={kpi} last={i === kpis.length - 1} />)}
            </div>

            <div style={{ ...card }}>
              <div style={{ ...cardHead, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: '0 0 2px' }}>Monthly application volume</p>
                  <p style={{ fontSize: 11, color: C.textMute, margin: 0 }}>Total applications received — last 6 months</p>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.textMute }}>
                  <span style={{ width: 14, height: 2, background: C.blue, borderRadius: 1, display: 'inline-block' }} />
                  Total
                </span>
              </div>
              <div style={{ padding: '16px 20px 20px' }}>
                {!hasTrends ? (
                  <EmptyState label="NO TREND DATA" height={220} />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={trends} margin={{ left: -10, right: 10, top: 4 }}>
                      <defs>
                        <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.blue} stopOpacity={0.18} />
                          <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.textMute, fontFamily: C.mono }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: C.textMute, fontFamily: C.mono }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip {...tooltipStyle} />
                      <Area type="monotone" dataKey="total" stroke={C.blue} strokeWidth={2.5}
                        fill="url(#totalFill)" dot={{ r: 4, fill: C.blue }} activeDot={{ r: 6, fill: C.blue }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          <LoanAdvisorChat />

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20, marginBottom: 28 }}>

          <div style={card}>
            <CardHeader title="Risk distribution" sub="Applications by risk category" />
            <div style={{ padding: 20 }}>
              {!hasRisk ? (
                <EmptyState label="NO DATA" height={180} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={riskDist} cx="50%" cy="50%" innerRadius={48} outerRadius={78}
                        dataKey="count" labelLine={false} label={renderPieLabel} strokeWidth={2} stroke={C.surface}>
                        {riskDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip {...tooltipStyle} formatter={(v: number) => [v.toLocaleString('en-IN'), 'Applications']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {riskDist.map(item => {
                      const pct = totalRisk > 0 ? Math.round((item.count / totalRisk) * 100) : 0
                      return (
                        <div key={item.name}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, fontWeight: 500, color: C.textSub }}>{item.name} risk</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontFamily: C.mono, fontSize: 12, fontWeight: 700, color: C.text }}>{item.count.toLocaleString('en-IN')}</span>
                              <span style={{ fontFamily: C.mono, fontSize: 11, color: C.textMute, minWidth: 30, textAlign: 'right' }}>{pct}%</span>
                            </div>
                          </div>
                          <div style={{ width: '100%', height: 6, background: C.elevated, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: item.color, width: `${pct}%`, borderRadius: 3, transition: 'width .7s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={card}>
            <CardHeader title="Decision breakdown" sub="Approved, rejected and pending" />
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Approved', value: approvedCount, color: C.green },
                { label: 'Rejected', value: rejectedCount, color: C.red   },
                { label: 'Pending',  value: pendingCount,  color: C.amber },
              ].map(item => {
                const pct = totalApps > 0 ? Math.round((item.value / totalApps) * 100) : 0
                return (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: C.textSub }}>{item.label}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: item.color }}>{item.value.toLocaleString('en-IN')}</span>
                        <span style={{ fontFamily: C.mono, fontSize: 11, color: C.textMute }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 6, background: C.elevated, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: 3, transition: 'width .7s ease' }} />
                    </div>
                  </div>
                )
              })}
              <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                {[{ value: approvedCount, color: C.green }, { value: rejectedCount, color: C.red }, { value: pendingCount, color: C.amber }].map((s, i) => {
                  const pct = totalApps > 0 ? (s.value / totalApps) * 100 : 0
                  return <div key={i} style={{ width: `${pct}%`, background: s.color }} />
                })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...card, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ ...cardHead, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: '0 0 2px' }}>Recent applications</p>
              <p style={{ fontSize: 11, color: C.textMute, margin: 0 }}>Latest 5 submitted</p>
            </div>
            <button className="view-btn" onClick={() => navigate('applicants')}>View all →</button>
          </div>
          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 24px' }}>
              <p style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.textMute, textTransform: 'uppercase', marginBottom: 8 }}>No applications</p>
              <p style={{ fontSize: 12, color: C.textMute, margin: 0 }}>Submit a loan application to get started</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: C.elevated }}>
                    {['Applicant', 'Loan amount', 'Risk level', 'Score', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: C.mono, whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((loan) => {
                    const risk  = loan.riskAssessment
                    const raw   = risk?.riskScore
                    const score = raw != null ? Math.round(raw) : null
                    return (
                      <tr key={loan._id} className="tbl-row">
                        <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: '0 0 2px' }}>{loan.applicant?.fullName || 'Unknown'}</p>
                          <p style={{ fontSize: 11, color: C.textMute, margin: 0 }}>{loan.applicant?.email}</p>
                        </td>
                        <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px', fontFamily: C.mono, fontSize: 12, fontWeight: 600, color: C.textSub }}>
                          {formatINR(Number(loan.loanAmount))}
                        </td>
                        <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px' }}><RiskBadge level={risk?.riskCategory} /></td>
                        <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px' }}>
                          {score != null
                            ? <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: C.textSub }}>{score}</span>
                            : <span style={{ color: C.textMute, fontSize: 13 }}>—</span>}
                        </td>
                        <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px' }}><StatusBadge status={loan.status} /></td>
                        <td style={{ borderTop: `1px solid ${C.border}`, padding: '13px 20px' }}>
                          <button className="tbl-action" onClick={() => navigate('details', loan._id)}>View</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table> 
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
