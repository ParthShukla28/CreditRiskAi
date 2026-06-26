import { useState, useEffect } from 'react'
import { Loader } from 'lucide-react'
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

const cardHead: React.CSSProperties = {
  padding: '14px 20px',
  borderBottom: `1px solid ${C.border}`,
}

const divider: React.CSSProperties = {
  border: 'none',
  borderTop: `1px solid ${C.border}`,
  margin: 0,
}

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)

interface Props {
  loanId: string
  navigate: (page: Page) => void
  showToast: (msg: string, type?: ToastMsg['type']) => void
}


interface TopFactor {
  factor:    string  
  impact:    number    
  
}

function InfoRow({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '10px 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 12, color: C.textMute }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.textSub }}>{value ?? '—'}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={card}>
      <div style={cardHead}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {title}
        </p>
      </div>
      <div style={{ padding: '0 20px' }}>
        {children}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const statusMap: Record<string, { color: string; bg: string; border: string }> = {
    pending:      { color: '#92400E', bg: '#FEF3C7', border: '#FCD34D' },
    under_review: { color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' },
    approved:     { color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' },
    rejected:     { color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' },
  }
  const key = status?.toLowerCase() ?? ''
  const style = statusMap[key]
  const label = status?.replace('_', ' ') || '—'

  if (!style) {
    return (
      <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize', color: C.textSub }}>
        {label}
      </span>
    )
  }

  return (
    <span style={{
      fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
      color: style.color, background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 4, padding: '2px 8px', letterSpacing: '0.04em',
    }}>
      {label}
    </span>
  )
}

function RiskBadge({ level }: { level?: string }) {
  const map: Record<string, string> = {
    low:    C.green,
    medium: C.amber,
    high:   C.red,
  }
  const color = map[level?.toLowerCase() ?? ''] ?? C.textMute
  return (
    <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize', color }}>
      {level || 'N/A'}
    </span>
  )
}



function ConfirmModal({
  action, applicantName, reviewNotes, onNotesChange,
  onConfirm, onCancel, loading,
}: {
  action: 'approved' | 'rejected'
  applicantName: string
  reviewNotes: string
  onNotesChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const isApprove = action === 'approved'
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(2px)',
    }}>
      <div style={{ ...card, width: 400, boxShadow: '0 20px 60px rgba(15,23,42,0.16)', overflow: 'hidden' }}>
        <div style={cardHead}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>
            {isApprove ? 'Approve' : 'Reject'} application?
          </p>
          <p style={{ fontSize: 11, color: C.textMute, margin: 0 }}>
            This will update the status for <strong style={{ color: C.textSub }}>{applicantName}</strong>
          </p>
        </div>
        <div style={{ padding: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 6 }}>
            Review notes <span style={{ color: C.textMute, fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            value={reviewNotes}
            onChange={e => onNotesChange(e.target.value)}
            rows={3}
            placeholder="Add notes about this decision…"
            style={{
              width: '100%', border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '9px 12px', fontSize: 13, fontFamily: C.sans,
              color: C.textSub, resize: 'none', outline: 'none',
              boxSizing: 'border-box', background: C.surface,
            }}
            className="detail-textarea"
          />
        </div>
        <hr style={divider} />
        <div style={{ padding: '14px 20px', display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px', borderRadius: 6,
              border: `1px solid ${C.border}`, background: C.surface,
              fontSize: 13, fontWeight: 600, color: C.textSub,
              cursor: 'pointer', fontFamily: C.sans,
            }}
            className="detail-cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '10px', borderRadius: 6,
              border: 'none', fontSize: 13, fontWeight: 600, color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: C.sans,
              background: isApprove ? C.green : C.red,
              opacity: loading ? 0.65 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {loading && <Loader style={{ width: 13, height: 13, animation: 'spin 0.7s linear infinite' }} />}
            Confirm {isApprove ? 'approval' : 'rejection'}
          </button>
        </div>
      </div>
    </div>
  )
}

const FACTOR_DEFS: Record<string, string> = {
  annual_inc:          'Yearly gross income',
  loan_amnt:           'Requested loan size',
  int_rate:            'Loan interest rate',
  emp_length:          'Years of employment',
  credit_history:      'Length of credit',
  debt_to_income:      'Loan vs income',
  monthly_payment_est: 'Estimated monthly cost',
  risk_ratio:          'Rate vs credit age',
  income_per_year_exp: 'Income per work year',
}

export default function LoanDetailsPage({ loanId, navigate, showToast }: Props) {
  const [loan, setLoan]                   = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading]             = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'approved' | 'rejected' | null>(null)
  const [reviewNotes, setReviewNotes]     = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await loanService.getLoanById(loanId)
        if (mounted) setLoan(data)
      } catch {
        showToast('Failed to load loan details', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [loanId, showToast])

  const handleAction = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    try {
      const res = await loanService.updateStatus(loanId, confirmAction, reviewNotes)
      setLoan(res.loan)
      setConfirmAction(null)
      setReviewNotes('')
      showToast(`Loan ${confirmAction}`, 'success')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Action failed'
      showToast(msg, 'error')
    } finally {
      setActionLoading(false)
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

  if (!loan) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 8, fontFamily: C.sans }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.textSub, margin: 0 }}>Application not found.</p>
        <button onClick={() => navigate('applicants')} style={{ fontSize: 13, color: C.blue, background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Go back
        </button>
      </div>
    )
  }

  const applicant = loan.applicant as Record<string, unknown>
  const risk      = loan.riskAssessment as Record<string, unknown> | null
  const status    = loan.status as string
  const isPending = status === 'pending' || status === 'under_review'

  const riskScore    = risk?.riskScore as number | undefined         
  const displayScore = riskScore != null ? Math.round(riskScore) : null
  const topFactors   = (risk?.topFactors ?? []) as TopFactor[]
  const confidence   = displayScore != null ? `${displayScore}%` : null
  const riskCategory = risk?.riskCategory as string | undefined       

  const fullName = applicant?.fullName as string || 'Unknown'
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: C.void, fontFamily: C.sans, color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        .detail-textarea:focus { border-color: ${C.blue} !important; }
        .detail-cancel-btn:hover { background: ${C.elevated} !important; }
        .back-btn:hover { color: ${C.textSub} !important; }
        .action-btn:hover { opacity: .88; }
        .info-row-last { border-bottom: none !important; }
      `}</style>

      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          applicantName={fullName}
          reviewNotes={reviewNotes}
          onNotesChange={setReviewNotes}
          onConfirm={handleAction}
          onCancel={() => { setConfirmAction(null); setReviewNotes('') }}
          loading={actionLoading}
        />
      )}

      <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate('applicants')}
            className="back-btn"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: C.textMute, fontFamily: C.sans,
              display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 12,
              transition: 'color .15s',
            }}
          >
            ← Back to applications
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>{fullName}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: C.mono, fontSize: 11, color: C.textMute }}>
                  ID: {(loan._id as string).slice(-8).toUpperCase()}
                </span>
                <StatusBadge status={status} />
                <span style={{ fontSize: 12, color: C.textMute }}>
                  {new Date(loan.createdAt as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {isPending && (
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button
                  onClick={() => setConfirmAction('rejected')}
                  className="action-btn"
                  style={{
                    padding: '10px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                    border: `1px solid ${C.blue}`, background: C.surface,
                    color: C.textSub, cursor: 'pointer', fontFamily: C.sans, transition: 'opacity .15s',
                  }}
                >
                  Reject
                </button>
                <button
                  onClick={() => setConfirmAction('approved')}
                  className="action-btn"
                  style={{
                    padding: '10px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                    border: `1px solid ${C.blue}`, background: C.surface,
                    color: C.textSub, cursor: 'pointer', fontFamily: C.sans, transition: 'opacity .15s',
                  }}
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, alignItems: 'start' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, gridColumn: 'span 2' }}>

            {risk && displayScore != null && (
              <div style={{ ...card }}>
                <div style={cardHead}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Risk assessment
                  </p>
                </div>

                <div style={{ padding: '20px 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  <div style={{ textAlign: 'center', borderRight: `1px solid ${C.border}`, paddingRight: 20 }}>
                    <p style={{ fontSize: 11, color: C.textMute, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk category</p>
                    <RiskBadge level={riskCategory} />
                  </div>
                  <div style={{ textAlign: 'center', paddingLeft: 20 }}>
                    <p style={{ fontSize: 11, color: C.textMute, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Default probability</p>
                    <p style={{ fontFamily: C.mono, fontSize: 36, fontWeight: 700, color: C.text, margin: '0 0 2px', lineHeight: 1 }}>
                      {confidence}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div style={card}>
              <div style={cardHead}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.blue, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  AI risk factors
                </p>
                <p style={{ fontSize: 11, color: C.textMute, margin: 0 }}>
                  Top {topFactors.length} Risk Factors driving this prediction.
                </p>
              </div>

              <div>
                {topFactors.length > 0 ? (
                  topFactors.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '14px 20px',
                        borderBottom: i < topFactors.length - 1 ? `1px solid ${C.border}` : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                            background: C.elevated, color: C.textMute,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, fontFamily: C.mono,
                          }}>
                            {i + 1}
                          </span>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: '0 0 2px' }}>
                              {f.factor.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </p>
                            <p style={{ fontSize: 11, color: C.textMute, margin: 0 }}>
                              {FACTOR_DEFS[f.factor] ?? ''}
                            </p>
                          </div>
                        </div>
                        <span style={{ 
                          fontSize: 12, fontWeight: 700, color: C.blue, fontFamily: C.mono, flexShrink: 0,
                          background: 'rgba(37,99,235,0.08)', padding: '4px 8px', borderRadius: 4
                        }}>
                          {(f.impact ?? 0).toFixed(3)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: C.textMute, margin: 0 }}>No risk factors available.</p>
                  </div>
                )}
              </div>

              {risk?.recommendation && (
                <>
                  <hr style={divider} />
                  <div style={{ padding: '14px 20px', background: 'rgba(37,99,235,0.03)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.blue, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      AI recommendation
                    </p>
                    <p style={{ fontSize: 13, color: C.textSub, margin: 0, lineHeight: 1.6 }}>
                      {(risk.recommendation as string).replace(
                        /score:\s*(0\.\d+)/,
                        (_: string, s: string) => `score: ${Math.round(parseFloat(s) * 100)}`
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>

            <Section title="Loan details">
              <InfoRow label="Loan amount"     value={formatINR(Number(loan.loanAmount))} />
              <InfoRow label="Interest rate"   value={`${loan.intRate}%`} />
              <InfoRow label="Loan term"       value={`${loan.loanTerm} months`} />
              <InfoRow label="Monthly payment" value={loan.monthlyPayment ? formatINR(Number(loan.monthlyPayment)) : '—'} />
              <div style={{ padding: '10px 0' }}>
                <span style={{ fontSize: 12, color: C.textMute }}>Purpose</span>
                <span style={{ float: 'right', fontSize: 13, fontWeight: 600, color: C.textSub, textTransform: 'capitalize' }}>
                  {(loan.loanPurpose as string)?.replace('_', ' ') || '—'}
                </span>
              </div>
            </Section>

            {(loan.reviewedBy || loan.reviewNotes || loan.reviewDate) && (
              <Section title="Review decision">
                {loan.reviewedBy && (
                  <InfoRow
                    label="Reviewed by"
                    value={`${(loan.reviewedBy as Record<string, string>).firstName} ${(loan.reviewedBy as Record<string, string>).lastName}`}
                  />
                )}
                {loan.reviewDate && (
                  <InfoRow
                    label="Review date"
                    value={new Date(loan.reviewDate as string).toLocaleDateString('en-IN')}
                  />
                )}
                {loan.reviewNotes && (
                  <div style={{ padding: '12px 0' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.textMute, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Notes
                    </p>
                    <p style={{
                      fontSize: 13, color: C.textSub, margin: 0, lineHeight: 1.6,
                      background: C.elevated, borderRadius: 6, padding: '10px 12px',
                      border: `1px solid ${C.border}`,
                    }}>
                      {loan.reviewNotes as string}
                    </p>
                  </div>
                )}
              </Section>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={card}>
              <div style={cardHead}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Applicant
                </p>
              </div>
              <div style={{ padding: '16px 20px 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(37,99,235,0.1)', color: C.blue,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, fontFamily: C.mono, flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>{fullName}</p>
                    <p style={{ fontSize: 12, color: C.textMute, margin: 0 }}>{applicant?.email as string}</p>
                  </div>
                </div>
                <InfoRow label="Phone" value={applicant?.phone as string} />
                <div style={{ padding: '10px 0' }}>
                  <span style={{ fontSize: 12, color: C.textMute }}>Age</span>
                  <span style={{ float: 'right', fontFamily: C.mono, fontSize: 13, fontWeight: 600, color: C.textSub }}>
                    {applicant?.age as number ?? '—'}
                  </span>
                </div>
              </div>
            </div>

            <Section title="Employment">
              <InfoRow label="Status"           value={(applicant?.employmentStatus as string)?.replace('-', ' ')} />
              <InfoRow label="Employment years" value={applicant?.empLength != null ? `${applicant.empLength} yrs` : '—'} />
              <div style={{ padding: '10px 0' }}>
                <span style={{ fontSize: 12, color: C.textMute }}>Credit history</span>
                <span style={{ float: 'right', fontFamily: C.mono, fontSize: 13, fontWeight: 600, color: C.textSub }}>
                  {applicant?.creditHistory != null ? `${applicant.creditHistory} yrs` : '—'}
                </span>
              </div>
            </Section>

            <Section title="Financials">
              <InfoRow label="Annual income"  value={formatINR(Number(applicant?.annualIncome || 0))} />
              <InfoRow label="Existing debts" value={formatINR(Number(applicant?.existingDebts || 0))} />
              <div style={{ padding: '10px 0' }}>
                <span style={{ fontSize: 12, color: C.textMute }}>Submitted by</span>
                <span style={{ float: 'right', fontSize: 13, fontWeight: 600, color: C.textSub }}>
                  {loan.submittedBy
                    ? `${(loan.submittedBy as Record<string, string>).firstName} ${(loan.submittedBy as Record<string, string>).lastName}`
                    : '—'}
                </span>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </div>
  )
}