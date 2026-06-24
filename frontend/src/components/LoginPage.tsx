// components/LoginPage.tsx
import { useState } from 'react'
import { authService } from '../services/authService'
import type { ToastMsg } from '../App'

interface Props {
  onLogin: (user: ReturnType<typeof authService.getCurrentUser>) => void
  onBack: () => void
  showToast: (msg: string, type?: ToastMsg['type']) => void
}

const DEMO_EMAIL    = 'admin@bank.com'
const DEMO_PASSWORD = 'password123'

export default function LoginPage({ onLogin, onBack, showToast }: Props) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      const user = await authService.login({ email, password })
      showToast('Sign In successful', 'success')
      onLogin(user)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Login failed. Please check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafafa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 14, marginBottom: 28, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← Back to Home
        </button>

        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, padding: '40px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#2563eb',  letterSpacing: '0.07em', marginBottom: 10 }}>
              CreditRiskAI
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', marginBottom: 6, letterSpacing: '-0.3px' }}>
              Welcome
            </h1>
            <p style={{ fontSize: 14, color: '#666' }}>Sign in to your account</p>
          </div>

          <div style={{
            background: '#f0f5ff',
            border: '1px solid #dbe7ff',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 28,
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', marginBottom: 6 }}>
              Demo Account
            </p>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>
              Email: <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{DEMO_EMAIL}</span>
            </p>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
              Password: <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{DEMO_PASSWORD}</span>
            </p>
            <button
              type="button"
              onClick={fillDemo}
              style={{
                background: '#2563eb', color: '#fff', border: 'none',
                padding: '7px 14px', borderRadius: 7, fontSize: 13,
                fontWeight: 500, cursor: 'pointer',
              }}
            >
              Fill in demo credentials
            </button>
          </div>

          {error && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fecaca',
              color: '#b91c1c', fontSize: 13, padding: '10px 14px',
              borderRadius: 8, marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="officer@bank.com"
                required
                style={{
                  width: '100%', padding: '11px 14px', fontSize: 14,
                  border: '1px solid #e0e0e0', borderRadius: 8,
                  outline: 'none', boxSizing: 'border-box', color: '#1a1a1a',
                  background: '#fff',
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '11px 80px 11px 14px', fontSize: 14,
                    border: '1px solid #e0e0e0', borderRadius: 8,
                    outline: 'none', boxSizing: 'border-box', color: '#1a1a1a',
                    background: '#fff',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, color: '#2563eb', fontWeight: 500, padding: '2px 4px',
                  }}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', background: loading ? '#93c5fd' : '#2563eb',
                color: '#fff', border: 'none', padding: '13px',
                borderRadius: 8, fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 20 }}>
          © {new Date().getFullYear()} CreditRiskAI
        </p>
      </div>
    </div>
  )
}