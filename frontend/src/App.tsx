import { useState, useEffect } from 'react'
import { authService } from './services/authService'

import HomePage     from './components/HomePage'
import LoginPage    from './components/LoginPage'
import Navigation   from './components/Navigation'
import Dashboard    from './components/DashboardPage'
import SubmitApplicant from './components/SubmitApplicantPage'
import LoanApplicants  from './components/LoanApplicantsPage'
import LoanDetails  from './components/LoanDetailsPage'
import Analytics   from './components/AnalyticsPage'
import Toast        from './components/Toast'

export type Page = 'home' |'login' | 'dashboard'|'submit' |'applicants'|'details' | 'analytics'

export interface ToastMsg { id: number; message: string; type: 'success' | 'error' | 'info' }

export default function App() {
  const [page, setPage]           = useState<Page>('home')
  const [user, setUser]           = useState(authService.getCurrentUser())
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)
  const [toasts, setToasts]       = useState<ToastMsg[]>([])

  useEffect(() => {
    if (authService.isLoggedIn() && authService.getCurrentUser()) {
      setPage('dashboard')
    }
  }, [])

  const navigate = (p: Page, loanId?: string) => {
    if (loanId) setSelectedLoanId(loanId)
    setPage(p)
    window.scrollTo(0, 0)
  }

  const showToast = (message: string, type: ToastMsg['type'] = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  const handleLogin = (u: ReturnType<typeof authService.getCurrentUser>) => {
    setUser(u)
    setPage('dashboard')
  }

  const handleLogout = async () => {
    await authService.logout()
    setUser(null)
    setPage('home')
  }

  if (page === 'home')  return <HomePage  onLogin={() => navigate('login')} />
  if (page === 'login') return <LoginPage onLogin={handleLogin} onBack={() => navigate('home')} showToast={showToast} />

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentPage={page}
        user={user}
        onNavigate={navigate}
        onLogout={handleLogout}
      />

      <main className="pt-16">
        {page === 'dashboard'  && <Dashboard   navigate={navigate} showToast={showToast} />}
        {page === 'submit'     && <SubmitApplicant showToast={showToast} />}
        {page === 'applicants' && <LoanApplicants  navigate={navigate} showToast={showToast} />}
        {page === 'details'    && <LoanDetails     loanId={selectedLoanId!} navigate={navigate} showToast={showToast} />}
        {page === 'analytics'  && <Analytics       showToast={showToast} />}
      </main>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(t => <Toast key={t.id} toast={t} />)}
      </div>
    </div>
  )
}
