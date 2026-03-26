import type { FormEvent } from 'react'

type AdminSigninPanelProps = {
  adminNameInput: string
  setAdminNameInput: (value: string) => void
  adminCodeInput: string
  setAdminCodeInput: (value: string) => void
  isSigningIn: boolean
  questionMessage: string
  onSignIn: (event: FormEvent) => void
}

export function AdminSigninPanel({
  adminNameInput,
  setAdminNameInput,
  adminCodeInput,
  setAdminCodeInput,
  isSigningIn,
  questionMessage,
  onSignIn,
}: AdminSigninPanelProps) {
  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Admin</p>
          <h1>Admin-inloggning</h1>
        </div>
        <p className="lead-text">Logga in med adminnamn och adminkod för att hantera frågor.</p>

        <form className="stacked-actions" onSubmit={onSignIn}>
          <label>
            Adminnamn
            <input
              className="special-input"
              type="text"
              value={adminNameInput}
              onChange={(e) => setAdminNameInput(e.target.value)}
              placeholder="Admin"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Adminkod
            <input
              className="special-input"
              type="password"
              value={adminCodeInput}
              onChange={(e) => setAdminCodeInput(e.target.value)}
              placeholder="Adminkod"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="primary-button" type="submit" disabled={isSigningIn}>
            {isSigningIn ? 'Kontrollerar...' : 'Logga in som admin'}
          </button>
        </form>

        {questionMessage ? <p className="save-pill">{questionMessage}</p> : null}
      </section>
    </div>
  )
}
