
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, ReferenceLine,
} from 'recharts'
import { analyticsService } from '../services/loanService'
import type { ToastMsg } from '../App'


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

const cardHead: React.CSSProperties = {
  padding: '14px 20px',
  borderBottom: `1px solid ${C.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

const divider: React.CSSProperties = {
  border: 'none',
  borderTop: `1px solid ${C.border}`,
  margin: 0,
}

const tooltipStyle = {
  contentStyle: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    fontSize: 12,
    color: C.textSub,
    fontFamily: C.mono,
    boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
  },
  labelStyle: { color: C.textMute, fontSize: 11 },
  itemStyle:  { color: C.textSub },
}

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)

const fmtIN = (value: number) => value.toLocaleString('en-IN')

interface Props { showToast: (msg: string, type?: ToastMsg['type']) => void }
interface OverviewMetric { value: number }
interface TrendPoint {
  month: string
  total: number
  approved: number
  rejected: number
  pending: number
}

function SectionLabel({ number, title, sub }: { number: string; title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
      <span style={{
        fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: C.blue,
        background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)',
        borderRadius: 4, padding: '2px 8px', flexShrink: 0, marginTop: 2,
      }}>
        {number}
      </span>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 1px' }}>{title}</p>
        <p style={{ fontSize: 11, color: C.textMute, margin: 0 }}>{sub}</p>
      </div>
    </div>
  )
}

function StatPill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <p style={{ fontFamily: C.mono, fontSize: 17, fontWeight: 700, color: color ?? C.text, margin: '0 0 1px', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: 10, color: C.textMute, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </p>
    </div>
  )
}

function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
      {items.map(item => (
        <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.textMute }}>
          <span style={{
            width: 16, height: 2, display: 'inline-block', flexShrink: 0, borderRadius: 1,
            background: item.dashed
              ? `repeating-linear-gradient(90deg,${item.color} 0,${item.color} 4px,transparent 4px,transparent 7px)`
              : item.color,
          }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

function EmptyState({ height = 200 }: { height?: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height, color: C.textDim, fontSize: 12, fontFamily: C.mono, letterSpacing: '0.06em',
    }}>
      NO DATA
    </div>
  )
}

function FooterStats({ stats }: { stats: { label: string; value: string | number; color?: string }[] }) {
  return (
    <>
      <hr style={divider} />
      <div style={{ padding: '12px 20px', background: C.elevated, display: 'flex', gap: 32 }}>
        {stats.map(s => (
          <div key={s.label}>
            <p style={{ fontFamily: C.mono, fontSize: 15, fontWeight: 700, color: s.color ?? C.text, margin: '0 0 1px' }}>
              {typeof s.value === 'number' ? fmtIN(s.value) : s.value}
            </p>
            <p style={{ fontSize: 10, color: C.textMute, margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}

function FunnelStep({
  label, value, total, color, isLast,
}: { label: string; value: number; total: number; color: string; isLast?: boolean }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ marginBottom: isLast ? 0 : 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: C.textSub }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color }}>{fmtIN(value)}</span>
          <span style={{ fontFamily: C.mono, fontSize: 11, color: C.textMute }}>{pct}%</span>
        </div>
      </div>
      <div style={{ width: '100%', height: 7, background: C.elevated, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(pct, 3)}%`, background: color, borderRadius: 3, transition: 'width .8s ease' }} />
      </div>
      {!isLast && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
          <div style={{ width: 1, height: 10, background: C.border }} />
        </div>
      )}
    </div>
  )
}

export default function AnalyticsPage({ showToast }: Props) {
  const [overview, setOverview] = useState<Record<string, OverviewMetric>>({})
  const [trends, setTrends]     = useState<TrendPoint[]>([])
  const [riskDist, setRiskDist] = useState<{ name: string; value: number; color: string }[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [ov, tr, rd] = await Promise.all([
          analyticsService.getOverview(),
          analyticsService.getTrends(),
          analyticsService.getRiskDistribution(),
        ])
        if (!mounted) return
        setOverview(ov)
        setTrends(tr as TrendPoint[])
        setRiskDist([
          { name: 'Low risk',    value: rd.low    || 0, color: C.green },
          { name: 'Medium risk', value: rd.medium || 0, color: C.amber },
          { name: 'High risk',   value: rd.high   || 0, color: C.red   },
        ])
      } catch {
        if (!mounted) return
        setError(true)
        showToast('Failed to load analytics', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [showToast])

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
        <div style={{
          width: 20, height: 20, border: `2px solid ${C.border}`,
          borderTop: `2px solid ${C.blue}`, borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <span style={{ fontFamily: C.mono, fontSize: 12, color: C.textMute, letterSpacing: '0.08em' }}>LOADING</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.void, gap: 8, fontFamily: C.sans }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.textSub, margin: 0 }}>Couldn't load analytics</p>
        <p style={{ fontSize: 12, color: C.textMute, margin: 0 }}>Please refresh or try again later.</p>
      </div>
    )
  }

  const totalApps    = overview.totalApplications?.value ?? 0
  const approvalRate = overview.approvalRate?.value      ?? 0
  const avgScore     = overview.averageRiskScore?.value  ?? 0
  const pending      = overview.pendingReviews?.value    ?? 0

  const decidedCount = totalApps - pending
  const approved     = Math.round(decidedCount * (approvalRate / 100))
  const rejected     = decidedCount - approved

  const hasTrends    = trends.some(t => t.total > 0)
  const totalRisk    = riskDist.reduce((s, d) => s + d.value, 0)
  const peakMonth    = hasTrends
    ? trends.reduce((a, b) => b.total > a.total ? b : a, trends[0]).month
    : '—'

  const waterfallData = trends.map((t, i) => {
    const prev  = i === 0 ? 0 : trends[i - 1].total
    const delta = i === 0 ? t.total : t.total - prev
    const base  = i === 0 ? 0 : Math.min(prev, t.total)
    return {
      month:    t.month,
      base,
      delta:    Math.abs(delta),
      positive: i === 0 ? true : delta >= 0,
      running:  t.total,
      rawDelta: i === 0 ? t.total : delta,
    }
  })

  const wfMin = Math.min(...waterfallData.map(d => d.base), 0)
  const wfMax = Math.max(...waterfallData.map(d => d.running), 1)

  const summaryStats = [
    { label: 'Total applications', value: fmtIN(totalApps),    color: C.text  },
    { label: 'Approval rate',      value: `${approvalRate}%`,  color: C.green },
    { label: 'Avg risk score',     value: String(avgScore),    color: C.red   },
    { label: 'Pending reviews',    value: fmtIN(pending),      color: C.amber },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.void, fontFamily: C.sans, color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        .save-btn {
          background: ${C.surface}; color: ${C.textSub};
          border: 1px solid ${C.border}; border-radius: 6px;
          padding: 10px 18px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background .15s; font-family: ${C.sans};
        }
        .save-btn:hover:not(:disabled) { background: ${C.elevated}; }
        .save-btn:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>

        <div style={{
          ...card, padding: '20px 24px', marginBottom: 28, background: C.elevated,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.blue, margin: '0 0 4px' }}>
              Portfolio analytics report
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>Risk & Performance Overview</h1>
            <p style={{ fontSize: 12, color: C.textMute, margin: 0 }}>Portfolio performance and risk distribution insights</p>
          </div>
          <button onClick={handleSaveReport} disabled={saving} className="save-btn">
            {saving ? 'Saving…' : 'Save report'}
          </button>
        </div>

        <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 36, overflow: 'hidden' }}>
          {summaryStats.map((s, i) => (
            <div key={s.label} style={{
              padding: '18px 24px',
              borderRight: i < summaryStats.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textMute, margin: '0 0 8px' }}>
                {s.label}
              </p>
              <p style={{ fontFamily: C.mono, fontSize: 26, fontWeight: 700, color: s.color, margin: 0, lineHeight: 1 }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

      
        <SectionLabel
          number="01"
          title="Net application change"
          sub="Month-over-month delta in total applications — green bars gain, red bars drop"
        />
        <div style={{ ...card, marginBottom: 36 }}>
          <div style={cardHead}>
            <Legend items={[
              { label: 'Net gain', color: C.green },
              { label: 'Net drop', color: C.red   },
            ]} />
            {hasTrends && <StatPill label="peak month" value={peakMonth} color={C.blue} />}
          </div>
          <div style={{ padding: '16px 20px 20px' }}>
            {!hasTrends ? <EmptyState height={240} /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={waterfallData} margin={{ left: -10, right: 10, top: 8 }} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: C.textMute, fontFamily: C.mono }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: C.textMute, fontFamily: C.mono }}
                    axisLine={false} tickLine={false} allowDecimals={false}
                    domain={[wfMin, wfMax + 2]}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(37,99,235,0.04)' }}
                    content={({ payload, label }) => {
                      if (!payload?.length) return null
                      const d = waterfallData.find(w => w.month === label)
                      if (!d) return null
                      return (
                        <div style={{ ...tooltipStyle.contentStyle, padding: '10px 14px' }}>
                          <p style={{ fontWeight: 700, color: C.textSub, margin: '0 0 6px', fontFamily: C.sans }}>{label}</p>
                          <p style={{ margin: '0 0 2px', color: C.textMute }}>
                            Running total: <span style={{ color: C.text, fontWeight: 600 }}>{fmtIN(d.running)}</span>
                          </p>
                          <p style={{ margin: 0, color: C.textMute }}>
                            Change:{' '}
                            <span style={{ color: d.positive ? C.green : C.red, fontWeight: 600 }}>
                              {d.rawDelta > 0 ? '+' : ''}{fmtIN(d.rawDelta)}
                            </span>
                          </p>
                        </div>
                      )
                    }}
                  />
                  <ReferenceLine y={0} stroke={C.border} />
                  <Bar dataKey="base"  stackId="wf" fill="transparent" />
                  <Bar dataKey="delta" stackId="wf" radius={[3, 3, 0, 0]}>
                    {waterfallData.map((d, i) => (
                      <Cell key={i} fill={d.positive ? C.green : C.red} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {hasTrends && (() => {
            const gains  = waterfallData.filter((_, i) => i > 0 && waterfallData[i].positive).length
            const drops  = waterfallData.filter((_, i) => i > 0 && !waterfallData[i].positive).length
            const netChg = trends.length > 1 ? trends[trends.length - 1].total - trends[0].total : 0
            return (
              <FooterStats stats={[
                { label: 'Months with growth',  value: gains },
                { label: 'Months with decline', value: drops },
                { label: 'Net change (period)',  value: (netChg >= 0 ? '+' : '') + fmtIN(netChg), color: netChg >= 0 ? C.green : C.red },
              ]} />
            )
          })()}
        </div>

  
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 36 }}>

          <div>
            <SectionLabel
              number="02"
              title="Approval funnel"
              sub="Conversion from submitted to final decision"
            />
            <div style={card}>
              <div style={cardHead}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.textSub, margin: '0 0 1px' }}>Decision pipeline</p>
                  <p style={{ fontSize: 11, color: C.textMute, margin: 0 }}>All-time application outcomes</p>
                </div>
                <StatPill label="approval rate" value={`${approvalRate}%`} color={C.green} />
              </div>
              <div style={{ padding: 20 }}>
                <FunnelStep label="Submitted" value={totalApps}    total={totalApps} color={C.blue}     />
                <FunnelStep label="Reviewed"  value={decidedCount} total={totalApps} color={C.blueSoft} />
                <FunnelStep label="Approved"  value={approved}     total={totalApps} color={C.green}    />
                <FunnelStep label="Rejected"  value={rejected}     total={totalApps} color={C.red}      isLast />
              </div>
              <FooterStats stats={[
                { label: 'Pending decision', value: pending,  color: C.amber },
                { label: 'Approved',         value: approved, color: C.green },
                { label: 'Rejected',         value: rejected, color: C.red   },
              ]} />
            </div>
          </div>

          <div>
            <SectionLabel
              number="03"
              title="Risk category breakdown"
              sub="Distribution of applications by assessed risk level"
            />
            <div style={card}>
              <div style={cardHead}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.textSub, margin: '0 0 1px' }}>Applications by risk level</p>
                  <p style={{ fontSize: 11, color: C.textMute, margin: 0 }}>Absolute count and proportion</p>
                </div>
                <StatPill label="total assessed" value={fmtIN(totalRisk)} />
              </div>
              <div style={{ padding: 20 }}>
                {totalRisk === 0 ? <EmptyState height={160} /> : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={riskDist}
                      layout="vertical"
                      margin={{ left: 8, right: 48, top: 4, bottom: 4 }}
                      barSize={22}
                    >
                      <XAxis type="number" tick={{ fontSize: 10, fill: C.textMute, fontFamily: C.mono }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11, fill: C.textSub, fontFamily: C.sans }} axisLine={false} tickLine={false} />
                      <Tooltip {...tooltipStyle} formatter={(v: number) => [fmtIN(v), 'Applications']} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
                      <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                        {riskDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <hr style={divider} />
              <div style={{ padding: '12px 20px', background: C.elevated, display: 'flex', gap: 20 }}>
                {riskDist.map(d => {
                  const pct = totalRisk > 0 ? Math.round((d.value / totalRisk) * 100) : 0
                  return (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: C.textMute }}>{d.name.split(' ')[0]}</span>
                      <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: d.color }}>{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

   
        <SectionLabel
          number="04"
          title="Application volume over time"
          sub="Monthly breakdown of total, approved, and rejected applications"
        />
        <div style={card}>
          <div style={cardHead}>
            <Legend items={[
              { label: 'Total',    color: C.blue  },
              { label: 'Approved', color: C.green, dashed: true },
              { label: 'Rejected', color: C.red,   dashed: true },
            ]} />
          </div>
          <div style={{ padding: '16px 20px 20px' }}>
            {!hasTrends ? <EmptyState height={240} /> : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trends} margin={{ left: -10, right: 10, top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.textMute, fontFamily: C.mono }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.textMute, fontFamily: C.mono }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [fmtIN(v)]} />
                  <Line type="monotone" dataKey="total"    stroke={C.blue}  strokeWidth={2.5} dot={{ r: 4, fill: C.blue  }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="approved" stroke={C.green} strokeWidth={1.5} dot={{ r: 3, fill: C.green }} strokeDasharray="5 3" activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="rejected" stroke={C.red}   strokeWidth={1.5} dot={{ r: 3, fill: C.red   }} strokeDasharray="5 3" activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          {hasTrends && (
            <FooterStats stats={[
              { label: 'Avg monthly volume', value: Math.round(trends.reduce((s, t) => s + t.total,        0) / trends.length) },
              { label: 'Total approved',     value: trends.reduce((s, t) => s + (t.approved ?? 0), 0), color: C.green },
              { label: 'Total rejected',     value: trends.reduce((s, t) => s + (t.rejected ?? 0), 0), color: C.red   },
            ]} />
          )}
        </div>

      </div>
    </div>
  )
}