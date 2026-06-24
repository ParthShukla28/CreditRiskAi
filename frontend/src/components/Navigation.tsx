// components/Navigation.tsx — Top nav bar for authenticated pages
import { useState, useRef, useEffect } from 'react'
import type { Page } from '../App'

interface Props {
  currentPage: Page
  user: { firstName: string; lastName: string; email: string; role: string } | null
  onNavigate: (page: Page) => void
  onLogout: () => void
}

const NAV_ITEMS: { page: Page; label: string }[] = [
  { page: 'dashboard',  label: 'Dashboard' },
  { page: 'submit',     label: 'Submit Applicant' },
  { page: 'applicants', label: 'Loan Applicants' },
  { page: 'analytics',  label: 'Analytics' },
]

export default function Navigation({ currentPage, user, onNavigate, onLogout }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
      background: '#111113',
      borderBottom: '1px solid #27272a',
      boxShadow: '0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.4)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Wordmark */}
        <div
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('dashboard')}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onNavigate('dashboard') }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.3px' }}>
            CreditRiskAI
          </span>
        </div>

        {/* Nav items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_ITEMS.map(item => {
            const isActive = currentPage === item.page
            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color: isActive ? '#60a5fa' : '#a1a1aa',
                  transition: 'background 0.12s, color 0.12s',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = '#fafafa'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isActive ? 'rgba(59,130,246,0.12)' : 'transparent'
                  e.currentTarget.style.color = isActive ? '#60a5fa' : '#a1a1aa'
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* User menu */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 9, border: `1px solid ${dropdownOpen ? '#27272a' : 'transparent'}`,
              background: dropdownOpen ? '#18181b' : 'transparent',
              cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#18181b'; e.currentTarget.style.borderColor = '#27272a' }}
            onMouseLeave={e => { if (!dropdownOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' } }}
          >
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#fafafa', lineHeight: 1.3, margin: 0 }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p style={{ fontSize: 10, color: '#71717a', textTransform: 'capitalize', lineHeight: 1.3, margin: 0 }}>{user?.role}</p>
            </div>
            <span style={{
              fontSize: 10, color: '#52525b', transition: 'transform 0.15s',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block',
            }}>
              ▾
            </span>
          </button>

          {dropdownOpen && (
            <div role="menu" style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: 200,
              background: '#18181b', border: '1px solid #27272a', borderRadius: 12,
              boxShadow: '0 4px 8px rgba(0,0,0,0.4), 0 16px 48px rgba(0,0,0,0.5)',
              overflow: 'hidden', zIndex: 50,
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #27272a' }}>
                <p style={{ fontSize: 10, color: '#71717a', marginBottom: 3 }}>Signed in as</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </p>
              </div>
              <div style={{ padding: '4px' }}>
                <button
                  role="menuitem"
                  onClick={() => { setDropdownOpen(false); onLogout() }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, color: '#f87171',
                    background: 'transparent', transition: 'background 0.1s', textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  )
}