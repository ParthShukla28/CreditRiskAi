
import { useState } from 'react'
import { Upload, UserPlus, Download, FileText, X, CheckCircle, Loader } from 'lucide-react'
import { loanService, uploadService } from '../services/loanService'
import type { ToastMsg } from '../App'


const C = {
  void:   '#FFFFFF',
  surface:  '#FFFFFF',
  elevated: '#F8FAFC',
  border:   '#E2E8F0',
  text:     '#0F172A', 
  textSub:  '#334155',
  textMute: '#94A3B8',
  textDim:  '#CBD5E1',
  blue:   '#2563EB',
  blueSoft: '#60A5FA',
  green:    '#059669',
  amber:  '#D97706',
  red:   '#DC2626',
  mono:   "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
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

const inputBase: React.CSSProperties = {
  width: '100%',
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  padding: '9px 12px',
  fontSize: 13,
  color: C.textSub,
  background: C.surface,
  fontFamily: C.sans,
  outline: 'none',
  boxSizing: 'border-box',
}

interface Props {
  showToast: (msg: string, type?: ToastMsg['type']) => void
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: C.red, margin: '4px 0 0', fontFamily: C.mono }}>{error}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="form-input" style={inputBase} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const { options, ...rest } = props
  return (
    <select {...rest} className="form-input" style={inputBase}>
      <option value="">Select…</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

const INITIAL_FORM = {
  fullName: '', email: '', phone: '', age: '',
  employmentStatus: '', existingDebts: '',
  annual_inc: '', emp_length: '', credit_history: '',
  loan_amnt: '', int_rate: '', loanPurpose: '', loanTerm: '',
}

interface RiskResult { riskScore: number; riskCategory: string }
interface CreatedRow { row: number; applicantName: string; riskCategory: string; riskScore: number }
interface UploadResult {
  message: string
  results: { success: number; failed: number; errors: string[]; created: CreatedRow[] }
}

export default function SubmitApplicantPage({ showToast }: Props) {
  const [tab, setTab] = useState<'form' | 'csv'>('form')

  const [form, setForm]             = useState(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState<Partial<typeof INITIAL_FORM>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [result, setResult]         = useState<RiskResult | null>(null)

  const [dragOver, setDragOver]     = useState(false)
  const [file, setFile]             = useState<File | null>(null)
  const [uploading, setUploading]   = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  const set = (field: keyof typeof INITIAL_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const calcMonthly = () => {
    const p = parseFloat(form.loan_amnt)
    const r = parseFloat(form.int_rate) / 100 / 12
    const n = parseInt(form.loanTerm) || 36
    if (!p || !r) return null
    const mp = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    return isNaN(mp) ? null : mp.toFixed(2)
  }

  const validateForm = () => {
    const errors: Partial<typeof INITIAL_FORM> = {}
    if (!form.fullName)         errors.fullName = 'Required'
    if (!form.email)            errors.email = 'Required'
    if (!form.employmentStatus) errors.employmentStatus = 'Required'
    if (!form.annual_inc)       errors.annual_inc = 'Required'
    if (!form.emp_length)       errors.emp_length = 'Required'
    if (!form.credit_history)   errors.credit_history = 'Required'
    if (!form.loan_amnt)        errors.loan_amnt = 'Required'
    if (!form.int_rate)         errors.int_rate = 'Required'
    if (!form.loanTerm)         errors.loanTerm = 'Required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setSubmitting(true)
    try {
      const res = await loanService.createLoan({
        ...form,
        age: form.age ? parseInt(form.age) : undefined,
        existingDebts: parseFloat(form.existingDebts) || 0,
        annual_inc: parseFloat(form.annual_inc),
        emp_length: parseFloat(form.emp_length),
        credit_history: parseFloat(form.credit_history),
        loan_amnt: parseFloat(form.loan_amnt),
        int_rate: parseFloat(form.int_rate),
        loanTerm: parseInt(form.loanTerm),
      })
      setResult({
        riskScore: res.riskAssessment.riskScore,
        riskCategory: res.riskAssessment.riskCategory,
      })
      setSubmitted(true)
      showToast('Application submitted', 'success')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Submission failed. Check that your ML model is running on port 5000.'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setForm(INITIAL_FORM)
    setFormErrors({})
    setSubmitted(false)
    setResult(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.csv')) setFile(f)
    else showToast('CSV files only', 'error')
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setUploadResult(null)
    try {
      const res = await uploadService.uploadCSV(file, setUploadProgress)
      setUploadResult(res)
      showToast(res.message, res.results.failed > 0 ? 'info' : 'success')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Upload failed'
      showToast(msg, 'error')
    } finally {
      setUploading(false)
    }
  }

  const riskColors: Record<string, { bg: string; border: string; color: string }> = {
    low:    { bg: 'rgba(5,150,105,.08)',  border: 'rgba(5,150,105,.25)',  color: C.green },
    medium: { bg: 'rgba(217,119,6,.08)',  border: 'rgba(217,119,6,.25)',  color: C.amber },
    high:   { bg: 'rgba(220,38,38,.08)',  border: 'rgba(220,38,38,.25)',  color: C.red },
  }

  const createdRowColor = (cat: string) =>
    cat === 'low' ? C.green : cat === 'medium' ? C.amber : cat === 'high' ? C.red : C.textMute

  return (
    <div style={{ minHeight: '100vh', background: C.void, fontFamily: C.sans, color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        .form-input:focus { border-color: ${C.blue} !important; }
        .tab-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 20px; font-size: 13px; font-weight: 600;
          border: 1px solid ${C.border}; background: ${C.surface};
          color: ${C.textMute}; cursor: pointer; transition: all .15s;
          font-family: ${C.sans};
        }
        .tab-btn.active { color: ${C.blue}; background: rgba(37,99,235,0.05); border-color: ${C.blue}; }
        .tab-btn:not(.active):hover { color: ${C.textSub}; background: ${C.elevated}; }
        .btn-primary {
          width: 100%; background: ${C.blue}; color: #fff;
          border: 1px solid ${C.blue}; border-radius: 6px;
          padding: 12px; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: opacity .15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-family: ${C.sans};
        }
        .btn-primary:hover:not(:disabled) { opacity: .9; }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .btn-secondary {
          background: ${C.surface}; color: ${C.blue};
          border: 1px solid ${C.border}; border-radius: 6px;
          padding: 9px 16px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: background .15s;
          display: flex; align-items: center; gap: 6px;
          font-family: ${C.sans};
        }
        .btn-secondary:hover { background: ${C.elevated}; }
        .link-btn {
          font-size: 12px; font-weight: 600; color: ${C.blue};
          background: none; border: none; cursor: pointer; padding: 0;
          transition: opacity .15s;
        }
        .link-btn:hover { opacity: .7; }
        .dropzone {
          border: 1px dashed ${C.border}; border-radius: 8px;
          padding: 48px 24px; text-align: center; cursor: pointer;
          transition: all .15s; background: ${C.surface};
        }
        .dropzone:hover { border-color: ${C.blue}; background: rgba(37,99,235,0.02); }
        .dropzone.dragover { border-color: ${C.blue}; background: rgba(37,99,235,0.05); }
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: 1024, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Submit loan application</h1>
          <p style={{ fontSize: 13, color: C.textMute, margin: 0 }}>
            Submit individually or upload a CSV for batch processing
          </p>
        </div>

        <div style={{ display: 'inline-flex', marginBottom: 24 }}>
          <button
            onClick={() => setTab('form')}
            className={`tab-btn ${tab === 'form' ? 'active' : ''}`}
            style={{ borderRadius: '6px 0 0 6px', borderRight: tab === 'form' ? undefined : 'none' }}
          >
            <UserPlus style={{ width: 15, height: 15 }} /> Individual form
          </button>
          <button
            onClick={() => setTab('csv')}
            className={`tab-btn ${tab === 'csv' ? 'active' : ''}`}
            style={{ borderRadius: '0 6px 6px 0', marginLeft: tab === 'csv' ? -1 : 0 }}
          >
            <Upload style={{ width: 15, height: 15 }} /> CSV upload
          </button>
        </div>

       
        {tab === 'form' && (
          <>
         
            {submitted && result ? (
              <div style={{ ...card, padding: '48px 32px', textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: 'rgba(5,150,105,.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <CheckCircle style={{ width: 28, height: 28, color: C.green }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>Application submitted</h2>
                <p style={{ fontSize: 13, color: C.textMute, margin: '0 0 24px' }}>The ML model has assessed this application.</p>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 12,
                  padding: '14px 24px', borderRadius: 8, marginBottom: 28,
                  fontFamily: C.mono, fontSize: 15, fontWeight: 700,
                  background: riskColors[result.riskCategory]?.bg,
                  border: `1px solid ${riskColors[result.riskCategory]?.border}`,
                  color: riskColors[result.riskCategory]?.color,
                }}>
                  <span>Risk score: {result.riskScore}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span style={{ textTransform: 'capitalize' }}>{result.riskCategory} risk</span>
                </div>

                <div>
                  <button onClick={handleReset} className="btn-primary" style={{ width: 'auto', padding: '11px 28px' }}>
                    Submit another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

               
                <div style={card}>
                  <div style={cardHead}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UserPlus style={{ width: 15, height: 15, color: C.blue }} /> Applicant information
                    </p>
                  </div>
                  <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Full name *" error={formErrors.fullName}>
                      <Input value={form.fullName} onChange={set('fullName')} />
                    </Field>
                    <Field label="Email *" error={formErrors.email}>
                      <Input type="email" value={form.email} onChange={set('email')} />
                    </Field>
                    <Field label="Phone">
                      <Input value={form.phone} onChange={set('phone')} />
                    </Field>
                    <Field label="Age">
                      <Input type="number" value={form.age} onChange={set('age')} min="18" max="90" />
                    </Field>
                    <Field label="Employment status *" error={formErrors.employmentStatus}>
                      <Select
                        value={form.employmentStatus}
                        onChange={set('employmentStatus')}
                        options={[
                          { value: 'Employed', label: 'Employed' },
                          { value: 'Self-employed', label: 'Self-employed' },
                          { value: 'Unemployed', label: 'Unemployed' },
                          { value: 'Retired', label: 'Retired' },
                          { value: 'Student', label: 'Student' },
                        ]}
                      />
                    </Field>
                    <Field label="Existing debts (₹)">
                      <Input type="number" value={form.existingDebts} onChange={set('existingDebts')} min="0" />
                    </Field>
                  </div>
                </div>

              
                <div style={card}>
                  <div style={cardHead}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText style={{ width: 15, height: 15, color: C.blue }} /> Financial profile
                    </p>
                    
                  </div>
                  <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <Field label="Annual income (₹) *" error={formErrors.annual_inc}>
                      <Input type="number" value={form.annual_inc} onChange={set('annual_inc')} min="0" />
                    </Field>
                    <Field label="Employment length (years) *" error={formErrors.emp_length}>
                      <Input type="number" value={form.emp_length} onChange={set('emp_length')} min="0" max="50" step="0.5" />
                    </Field>
                    <Field label="Credit history (years) *" error={formErrors.credit_history}>
                      <Input type="number" value={form.credit_history} onChange={set('credit_history')} min="0" max="50" step="0.5" />
                    </Field>
                  </div>
                </div>

               
                <div style={card}>
                  <div style={cardHead}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText style={{ width: 15, height: 15, color: C.blue }} /> Loan details
                    </p>
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <Field label="Loan amount (₹) *" error={formErrors.loan_amnt}>
                        <Input type="number" value={form.loan_amnt} onChange={set('loan_amnt')} min="1000" />
                      </Field>
                      <Field label="Interest rate (%) *" error={formErrors.int_rate}>
                        <Input type="number" value={form.int_rate} onChange={set('int_rate')} min="0.1" max="50" step="0.01" />
                      </Field>
                      <Field label="Loan term (months) *" error={formErrors.loanTerm}>
                        <Select
                          value={form.loanTerm}
                          onChange={set('loanTerm')}
                          options={[
                            { value: '12',  label: '12 months (1 year)'  },
                            { value: '24',  label: '24 months (2 years)' },
                            { value: '36',  label: '36 months (3 years)' },
                            { value: '48',  label: '48 months (4 years)' },
                            { value: '60',  label: '60 months (5 years)' },
                            { value: '84',  label: '84 months (7 years)' },
                            { value: '120', label: '120 months (10 years)' },
                            { value: '180', label: '180 months (15 years)' },
                            { value: '240', label: '240 months (20 years)' },
                            { value: '360', label: '360 months (30 years)' },
                          ]}
                        />
                      </Field>
                      <Field label="Loan purpose">
                        <Select
                          value={form.loanPurpose}
                          onChange={set('loanPurpose')}
                          options={[
                            { value: 'home_purchase',      label: 'Home purchase' },
                            { value: 'business',           label: 'Business expansion' },
                            { value: 'education',          label: 'Education' },
                            { value: 'debt_consolidation', label: 'Debt consolidation' },
                            { value: 'vehicle',            label: 'Vehicle' },
                            { value: 'other',              label: 'Other' },
                          ]}
                        />
                      </Field>
                    </div>

                    {calcMonthly() && (
                      <div style={{
                        marginTop: 16, display: 'flex', alignItems: 'center', gap: 10,
                        background: 'rgba(37,99,235,0.05)', border: `1px solid rgba(37,99,235,0.2)`,
                        borderRadius: 6, padding: '12px 16px',
                      }}>
                        <CheckCircle style={{ width: 15, height: 15, color: C.blue, flexShrink: 0 }} />
                        <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>
                          Estimated monthly payment:{' '}
                          <span style={{ fontFamily: C.mono, fontWeight: 700, color: C.blue }}>
                            ₹{Number(calcMonthly()).toLocaleString('en-IN')}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '14px', fontSize: 14 }}>
                  {submitting ? (
                    <><Loader style={{ width: 15, height: 15, animation: 'spin 0.7s linear infinite' }} /> Assessing risk…</>
                  ) : (
                    'Submit & assess risk'
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {tab === 'csv' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={card}>
              <div style={{
                ...cardHead, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: '0 0 2px' }}>Batch CSV upload</p>
                  <p style={{ fontSize: 11, color: C.textMute, margin: 0 }}>
                    Upload multiple applications at once.
                  </p>
                </div>
                <button onClick={() => uploadService.downloadTemplate()} className="btn-secondary" style={{ flexShrink: 0 }}>
                  <Download style={{ width: 13, height: 13 }} /> Download template
                </button>
              </div>

              <div style={{ padding: 20 }}>
                <div style={{
                  background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: 14, marginBottom: 20,
                }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.textSub, margin: '0 0 6px' }}>Required CSV columns</p>
                  <p style={{ fontSize: 11, color: C.textMute, fontFamily: C.mono, margin: 0, lineHeight: 1.6 }}>
                    fullName, email, phone, employmentStatus, annual_inc, emp_length, credit_history, existingDebts, loan_amnt, int_rate, loanPurpose, loanTerm
                  </p>
                </div>

                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`dropzone ${dragOver ? 'dragover' : ''}`}
                  onClick={() => document.getElementById('csvInput')?.click()}
                >
                  <input id="csvInput" type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileInput} />
                  <Upload style={{ width: 32, height: 32, color: C.textDim, margin: '0 auto 12px' }} />
                  {file ? (
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: '0 0 2px' }}>{file.name}</p>
                      <p style={{ fontSize: 11, color: C.textMute, margin: '0 0 8px', fontFamily: C.mono }}>{(file.size / 1024).toFixed(1)} KB</p>
                      <button
                        onClick={e => { e.stopPropagation(); setFile(null); setUploadResult(null) }}
                        className="link-btn"
                        style={{ color: C.red, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <X style={{ width: 11, height: 11 }} /> Remove file
                      </button>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: '0 0 2px' }}>Drop your CSV file here</p>
                      <p style={{ fontSize: 11, color: C.textMute, margin: 0 }}>or click to browse — max 5MB</p>
                    </>
                  )}
                </div>

                {file && !uploading && !uploadResult && (
                  <button onClick={handleUpload} className="btn-primary" style={{ marginTop: 16, padding: '13px' }}>
                    Upload & process all applications
                  </button>
                )}

                {uploading && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textMute, marginBottom: 6, fontFamily: C.mono }}>
                      <span>Uploading & processing…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: C.elevated, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: C.blue, width: `${uploadProgress}%`, borderRadius: 3, transition: 'width .3s ease' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {uploadResult && (
              <div style={card}>
                <div style={cardHead}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub, margin: 0 }}>Processing report</p>
                </div>
                <div style={{ padding: 20 }}>

                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 13, color: C.textSub, margin: '0 0 4px' }}>
                      <span style={{ fontWeight: 600 }}>{uploadResult.results.success}</span> applications processed
                      {uploadResult.results.failed > 0 && (
                        <>, <span style={{ fontWeight: 600 }}>{uploadResult.results.failed}</span> failed</>
                      )}
                      .
                    </p>
                  </div>

                  {uploadResult.results.errors.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: C.textSub, margin: '0 0 8px' }}>Errors</p>
                      <ul style={{ fontSize: 12, color: C.textMute, margin: 0, paddingLeft: 18, lineHeight: 2, fontFamily: C.mono }}>
                        {uploadResult.results.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}

                  {uploadResult.results.created.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: C.elevated }}>
                            {['Row', 'Applicant', 'Risk category', 'Risk score'].map(h => (
                              <th key={h} style={{
                                padding: '10px 16px', textAlign: 'left',
                                fontSize: 10, fontWeight: 700, color: C.textMute,
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                fontFamily: C.mono, whiteSpace: 'nowrap',
                                borderBottom: `1px solid ${C.border}`,
                              }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {uploadResult.results.created.map((r, i) => (
                            <tr key={i}>
                              <td style={{ borderTop: `1px solid ${C.border}`, padding: '11px 16px', fontFamily: C.mono, fontSize: 12, color: C.textMute }}>
                                #{r.row}
                              </td>
                              <td style={{ borderTop: `1px solid ${C.border}`, padding: '11px 16px', fontSize: 13, fontWeight: 600, color: C.textSub }}>
                                {r.applicantName}
                              </td>
                              <td style={{
                                borderTop: `1px solid ${C.border}`, padding: '11px 16px',
                                fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                                color: createdRowColor(r.riskCategory),
                              }}>
                                {r.riskCategory}
                              </td>
                              <td style={{ borderTop: `1px solid ${C.border}`, padding: '11px 16px', fontFamily: C.mono, fontSize: 12, fontWeight: 700, color: C.textSub }}>
                                {r.riskScore}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <button onClick={() => { setFile(null); setUploadResult(null) }} className="link-btn" style={{ marginTop: 16 }}>
                    Upload another file
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}