interface Props { onLogin: () => void }

export default function HomePage({ onLogin }: Props) {
  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

\      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            CreditRiskAI
          </span>
          <button
            onClick={onLogin}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
          >
            Sign In
          </button>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-8 border-b border-gray-100">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-5">
            AI-Powered Credit Risk Platform
          </p>
          <h1 className="text-5xl font-bold leading-tight text-gray-900 mb-5 tracking-tight">
            Assess loan default risk<br />
            <span className="text-blue-600">in seconds, not hours.</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-9 max-w-lg">
           CreditRiskAI helps bank officers make loan decisions — with clear risk scores, explainability, and a full audit trail.          </p>
          <button
            onClick={onLogin}
            className="bg-blue-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            Get Started
          </button>
        </div>
      </section>

      <section className="py-18 px-8 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            Everything you need to assess risk
          </h2>
          <p className="text-base text-gray-500 mb-12 leading-relaxed max-w-md">
            Built for loan officers who need fast, reliable, and explainable decisions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Instant risk predictions',
                desc: 'Submit an application and get a risk score, category, and top contributing factors immediately.',
              },
              {
                title: 'Batch CSV processing',
                desc: 'Upload a CSV with multiple applications at once. Each row is validated, scored, and saved automatically.',
              },
              {
                title: 'AI explainability',
                desc: 'The model shows you exactly which factors drove the risk score — so decisions are never a black box.',
              },
              {
                title: 'Approve / reject workflow',
                desc: 'One-click approve or reject with confirmation dialogs, optional review notes, and instant status updates.',
              },
              {
                title: 'Full audit trail',
                desc: 'Every approval, rejection, and login is recorded with timestamps and user details for compliance and review.',
              },
              {
                title: 'Analytics dashboard',
                desc: 'Track approval rates, risk distribution, and processing trends over time with exportable charts and reports.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <h3 className="text-base font-semibold text-gray-900 mb-2.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-18 px-8 border-b border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-12 tracking-tight">
            From application to decision
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Submit the application', desc: 'Enter applicant details manually or upload a CSV for bulk processing.' },
              { step: '2', title: 'Model scores it', desc: 'ML model evaluates the inputs and returns a risk score and category.' },
              { step: '3', title: 'Review the reasoning', desc: 'See the top risk factors and their impact weights.' },
              { step: '4', title: 'Approve or reject', desc: 'Make the final call with one click. The decision and your notes are logged automatically.' },
            ].map((s) => (
              <div key={s.step} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-xs font-bold text-blue-600 mb-2.5 tracking-wider">
                  STEP {s.step}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-8 border-b border-gray-100">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3.5 tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-base text-gray-500 mb-8 leading-relaxed">
            Sign in to start reviewing loan applications with your AI model.
          </p>
          <button
            onClick={onLogin}
            className="bg-blue-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            Sign In to CreditRiskAI
          </button>
        </div>
      </section>

      <footer className="py-10 px-8 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex justify-between flex-wrap gap-6 items-start">
          <div>
            <p className="text-base font-bold text-gray-900 mb-1.5">CreditRiskAI</p>
            <p className="text-sm text-gray-400 leading-relaxed">AI-Powered Credit Risk Platform</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            <p className="font-semibold text-gray-900 mb-0.5">Built by Parth Shukla</p>
            <a href="tel:+916392665447" className="text-gray-600 hover:text-gray-900 transition-colors">+91 63926 65447</a>
            <a href="mailto:parthshukla142@gmail.com" className="text-blue-600 hover:underline">parthshukla142@gmail.com</a>
            <a href="https://www.linkedin.com/in/parth-shukla-4005a6374" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-5 border-t border-gray-100 text-xs text-gray-400">
          © {new Date().getFullYear()} CreditRiskAI
        </div>
      </footer>

    </div>
  )
}