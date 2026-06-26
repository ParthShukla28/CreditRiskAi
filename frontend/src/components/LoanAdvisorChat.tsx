

import { useState, useRef } from 'react'

const C = {
  surface:  '#FFFFFF',
  elevated: '#F8FAFC',
  border:   '#E2E8F0',
  text:     '#0F172A',
  textSub:  '#334155',
  textMute: '#94A3B8',
  textDim:  '#CBD5E1',
  blue:     '#2563EB',
  green:    '#059669',
  greenBg:  '#ECFDF5',
  amber:    '#D97706',
  amberBg:  '#FFFBEB',
  red:      '#DC2626',
  redBg:    '#FEF2F2',
  mono:     "'JetBrains Mono', 'Fira Code', monospace",
  sans:     "'Inter', system-ui, sans-serif",
}

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000'

interface Field {
  key:         string
  label:       string
  unit:        string
  hint:        string
  step?:       string
}

const FIELDS: Field[] = [
  { key: 'loan_amnt',      label: 'Loan Amount',       unit: '₹',   hint: 'e.g. 500000' },
  { key: 'annual_inc',     label: 'Annual Income',     unit: '₹',   hint: 'e.g. 800000' },
  { key: 'int_rate',       label: 'Interest Rate',     unit: '%',   hint: 'e.g. 11.5', step: '0.1' },
  { key: 'emp_length',     label: 'Employment Length', unit: 'yrs', hint: 'e.g. 3' },
  { key: 'credit_history', label: 'Credit History',    unit: 'yrs', hint: 'e.g. 5' },
]

type FieldValues = Record<string, string>

function riskColor(cat?: string) {
  if (cat === 'Low')    return { color: C.green, bg: C.greenBg, border: '#A7F3D0' }
  if (cat === 'High')   return { color: C.red,   bg: C.redBg,   border: '#FECACA' }
  if (cat === 'Medium') return { color: C.amber, bg: C.amberBg, border: '#FDE68A' }
  return { color: C.textMute, bg: C.elevated, border: C.border }
}

function RichText({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {text.split('\n').map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/)
        return (
          <p key={i} style={{
            margin: 0, fontSize: 12, lineHeight: 1.6, color: C.textSub,
            paddingLeft: line.startsWith('•') ? 6 : 0,
          }}>
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**')
                ? <strong key={j} style={{ color: C.text }}>{p.slice(2, -2)}</strong>
                : <span key={j}>{p}</span>
            )}
          </p>
        )
      })}
    </div>
  )
}

export default function LoanAdvisorChat() {
  const empty = { loan_amnt: '', annual_inc: '', int_rate: '', emp_length: '', credit_history: '' }
  const [values, setValues]   = useState<FieldValues>(empty)
  const [result, setResult]   = useState<{ reply: string; risk_score?: number; risk_category?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const inputRefs             = useRef<(HTMLInputElement | null)[]>([])

  const allFilled = FIELDS.every(f => values[f.key]?.trim() !== '')

  const handleAsk = async () => {
    if (!allFilled || loading) return
    setLoading(true)
    setError(null)
    setResult(null)

    const payload = {
      loan_amnt:      Number(values.loan_amnt),
      annual_inc:     Number(values.annual_inc),
      int_rate:       Number(values.int_rate),
      emp_length:     Number(values.emp_length),
      credit_history: Number(values.credit_history),
    }

    try {
      const res  = await fetch(`${API_BASE}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Could not reach the risk service. Make sure the API is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const next = inputRefs.current[idx + 1]
      if (next) next.focus()
      else if (allFilled) handleAsk()
    }
  }

  const rc  = result ? riskColor(result.risk_category) : null
  const pct = result?.risk_score != null ? Math.round(result.risk_score * 100) : null

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 8, display: 'flex', flexDirection: 'column',
      fontFamily: C.sans, overflow: 'hidden',
    }}>

      
      <div style={{
        padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        position: 'relative',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', background: C.blue,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: C.mono,
        }}>AI</div>
        <p style={{
          margin: 0, fontSize: 15, fontWeight: 700, color: C.text,
          fontFamily: "'Poppins', 'Inter', system-ui, sans-serif",
          letterSpacing: '0.01em',
        }}>AiRisk Advisor</p>
      </div>

      <div style={{ padding: '16px 18px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FIELDS.map((field, idx) => (
          <div key={field.key}>
            <label style={{
              display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: C.textMute, marginBottom: 5, fontFamily: C.mono,
            }}>
              {field.label}
            </label>
            <div
              style={{
                display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`,
                borderRadius: 6, overflow: 'hidden', background: C.surface, transition: 'border-color .15s',
              }}
              onFocusCapture={e => (e.currentTarget as HTMLDivElement).style.borderColor = C.blue}
              onBlurCapture={e  => (e.currentTarget as HTMLDivElement).style.borderColor = C.border}
            >
              <span style={{
                padding: '0 10px', height: 36, display: 'flex', alignItems: 'center',
                background: C.elevated, borderRight: `1px solid ${C.border}`,
                fontSize: 12, fontWeight: 600, color: C.textMute, fontFamily: C.mono,
                flexShrink: 0, minWidth: 38, justifyContent: 'center',
              }}>
                {field.unit}
              </span>
              <input
                ref={el => (inputRefs.current[idx] = el)}
                type="number"
                step={field.step ?? '1'}
                value={values[field.key]}
                onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                onKeyDown={e => handleKey(e, idx)}
                style={{
                  flex: 1, border: 'none', outline: 'none', padding: '0 10px',
                  height: 36, fontSize: 13, fontFamily: C.mono, color: C.text,
                  background: 'transparent', width: 0,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 18px' }}>
        <button
          onClick={handleAsk}
          disabled={!allFilled || loading}
          style={{
            width: '100%', height: 38,
            background:   allFilled && !loading ? C.blue : C.elevated,
            color:        allFilled && !loading ? '#fff' : C.textMute,
            border:       `1px solid ${allFilled && !loading ? C.blue : C.border}`,
            borderRadius: 6, fontSize: 13, fontWeight: 600, fontFamily: C.sans,
            cursor: allFilled && !loading ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background .15s, color .15s, border-color .15s',
          }}
        >
          {loading
            ? <>
                <div style={{
                  width: 13, height: 13,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff', borderRadius: '50%',
                  animation: 'advisorSpin .7s linear infinite',
                }} />
                Analysing…
              </>
            : <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M4.5 6.5h4M8.5 6.5L6.5 4.5M8.5 6.5L6.5 8.5"
                    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Ask AiRisk Advisor
              </>
          }
        </button>
        {!allFilled && !result && (
          <p style={{ margin: '7px 0 0', fontSize: 10, color: C.textMute, textAlign: 'center', fontFamily: C.mono }}>
            
          </p>
        )}
      </div>

      {error && (
        <div style={{ margin: '0 18px 16px', padding: '10px 12px', background: C.redBg, border: `1px solid #FECACA`, borderRadius: 6 }}>
          <p style={{ margin: 0, fontSize: 12, color: C.red }}>{error}</p>
        </div>
      )}

      {result && rc && (
        <div style={{ margin: '0 18px 18px', padding: '12px 14px', background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: rc.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: rc.color }}>{result.risk_category} Risk</span>
            </div>
            {pct != null && (
              <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: rc.color }}>{pct}%</span>
            )}
          </div>
          {pct != null && (
            <div style={{ height: 4, background: `${rc.color}25`, borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: rc.color, borderRadius: 2, transition: 'width .6s ease' }} />
            </div>
          )}
          <RichText text={result.reply} />
          <button
            onClick={() => { setResult(null); setValues(empty) }}
            style={{
              marginTop: 10, background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: C.textMute, fontFamily: C.mono, padding: 0,
            }}
          >
            ← Clear &amp; reset
          </button>
        </div>
      )}

      <style>{`@keyframes advisorSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}