import { useEffect, useState } from 'react'

type PageId = 'login' | 'start' | 'tips' | 'mine' | 'rules' | 'admin'

type NavItem = {
  id: PageId
  label: string
}

type SummaryCard = {
  title: string
  detail: string
}

type RuleRow = {
  category: string
  prediction: string
  lockTime: string
}

type ParticipantSession = {
  participantId: number
  name: string
}

type FixtureTip = {
  match: string
  date: string
  homeScore: number | ''
  awayScore: number | ''
  sign: '' | '1' | 'X' | '2'
  status: string
}

type GroupPlacement = {
  group: string
  picks: string[]
}

type KnockoutPredictionRound = {
  title: string
  picks: string[]
}

type SpecialPredictions = {
  winner: string
  topScorer: string
}

type PersistedTipsState = {
  fixtureTips: FixtureTip[]
  groupPlacements: GroupPlacement[]
  knockoutPredictions: KnockoutPredictionRound[]
  specialPredictions: SpecialPredictions
}

const navItems: NavItem[] = [
  { id: 'start', label: 'Start' },
  { id: 'tips', label: 'Lämna tips' },
  { id: 'mine', label: 'Mina tips' },
  { id: 'rules', label: 'Regler' },
  { id: 'admin', label: 'Admin' },
]

const summaryCards: SummaryCard[] = [
  { title: '48 lag', detail: 'Deltagande nationer' },
  { title: 'Grupp A-L', detail: '12 grupper med 4 lag' },
  { title: '32 → Final', detail: 'Från sextondelsfinaler till final' },
]

const categoryItems = [
  { label: 'Gruppspelsmatcher', count: 104 },
  { label: 'Gruppplaceringar', count: 12 },
  { label: 'Slutspel', count: 31 },
  { label: 'Slutsegrare', count: 1 },
  { label: 'Skytteligavinnare', count: 1 },
  { label: 'Extrafrågor', count: 5 },
]

const progressItems = [
  { label: 'Gruppspel', value: 72 },
  { label: 'Gruppplaceringar', value: 40 },
  { label: 'Slutspel', value: 18 },
  { label: 'Special', value: 100 },
  { label: 'Extrafrågor', value: 50 },
]

const fixtureTemplates: Array<{ match: string; date: string; status: string; defaultScore: string; defaultSign: '' | '1' | 'X' | '2' }> = [
  { match: 'USA - CAN', date: '2026-06-11 18:00', status: 'Öppet', defaultScore: '2-1', defaultSign: '1' },
  { match: 'MEX - GER', date: '2026-06-11 21:00', status: 'Öppet', defaultScore: '1-1', defaultSign: 'X' },
  { match: 'BRA - ARG', date: '2026-06-12 18:00', status: 'Låst', defaultScore: '', defaultSign: '' },
]

const groupPlacementTemplates: GroupPlacement[] = [
  { group: 'Grupp A', picks: ['Kanada', 'SWE/POL/ALB/UKR', 'Ghana', 'Peru'] },
  { group: 'Grupp B', picks: ['Spanien', 'Japan', 'Marocko', 'Ecuador'] },
  { group: 'Grupp C', picks: ['Argentina', 'Nederländerna', 'Nigeria', 'Costa Rica'] },
]

const groupTeamOptions = Object.fromEntries(
  groupPlacementTemplates.map((template) => [template.group, template.picks]),
) as Record<string, string[]>

function getAvailableGroupTeams(placement: GroupPlacement, index: number): string[] {
  const currentPick = placement.picks[index]
  const availableTeams = [...(groupTeamOptions[placement.group] ?? [])]

  if (currentPick.trim() && !availableTeams.includes(currentPick)) {
    return [currentPick, ...availableTeams]
  }

  return availableTeams
}

const defaultSpecialPredictions: SpecialPredictions = {
  winner: 'Argentina',
  topScorer: 'Kylian Mbappé',
}

const PARTICIPANT_STORAGE_KEY = 'vm2026.participant'
const QUICK_SCORE_GROUPS: Array<{
  key: 'home-win' | 'draw' | 'away-win'
  label: string
  presets: Array<{ home: number; away: number }>
}> = [
  {
    key: 'home-win',
    label: 'Hemmaseger',
    presets: [
      { home: 1, away: 0 },
      { home: 2, away: 0 },
      { home: 2, away: 1 },
      { home: 3, away: 0 },
      { home: 3, away: 1 },
      { home: 4, away: 1 },
    ],
  },
  {
    key: 'draw',
    label: 'Oavgjort',
    presets: [
      { home: 0, away: 0 },
      { home: 1, away: 1 },
      { home: 2, away: 2 },
      { home: 3, away: 3 },
      { home: 4, away: 4 },
      { home: 5, away: 5 },
    ],
  },
  {
    key: 'away-win',
    label: 'Bortaseger',
    presets: [
      { home: 0, away: 1 },
      { home: 0, away: 2 },
      { home: 1, away: 2 },
      { home: 0, away: 3 },
      { home: 1, away: 3 },
      { home: 1, away: 4 },
    ],
  },
]

function deriveSignFromScore(homeScore: number | '', awayScore: number | ''): '' | '1' | 'X' | '2' {
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return ''
  }

  if (homeScore > awayScore) {
    return '1'
  }

  if (homeScore < awayScore) {
    return '2'
  }

  return 'X'
}

function createDefaultFixtureTips(): FixtureTip[] {
  return fixtureTemplates.map((row) => {
    const [home, away] = row.defaultScore ? row.defaultScore.split('-') : ['', '']

    return {
      match: row.match,
      date: row.date,
      status: row.status,
      homeScore: home === '' ? '' : Number(home),
      awayScore: away === '' ? '' : Number(away),
      sign: row.defaultSign,
    }
  })
}

function normalizeFixtureTips(rawTips: unknown): FixtureTip[] {
  if (!Array.isArray(rawTips)) {
    return createDefaultFixtureTips()
  }

  return fixtureTemplates.map((template) => {
    const found = rawTips.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        'match' in item &&
        'date' in item &&
        (item as { match?: string }).match === template.match &&
        (item as { date?: string }).date === template.date,
    ) as Partial<FixtureTip> | undefined

    if (!found) {
      const [home, away] = template.defaultScore ? template.defaultScore.split('-') : ['', '']
      return {
        match: template.match,
        date: template.date,
        status: template.status,
        homeScore: home === '' ? '' : Number(home),
        awayScore: away === '' ? '' : Number(away),
        sign: template.defaultSign,
      }
    }

    return {
      match: template.match,
      date: template.date,
      status: template.status,
      homeScore: Number.isInteger(found.homeScore) ? found.homeScore : '',
      awayScore: Number.isInteger(found.awayScore) ? found.awayScore : '',
      sign: found.sign === '1' || found.sign === 'X' || found.sign === '2' ? found.sign : '',
    }
  })
}

function normalizeGroupPlacements(rawPlacements: unknown): GroupPlacement[] {
  if (!Array.isArray(rawPlacements)) {
    return groupPlacementTemplates
  }

  return groupPlacementTemplates.map((template) => {
    const found = rawPlacements.find(
      (item) => item && typeof item === 'object' && 'group' in item && (item as { group?: string }).group === template.group,
    ) as Partial<GroupPlacement> | undefined

    if (!found || !Array.isArray(found.picks) || found.picks.length !== 4) {
      return template
    }

    return {
      group: template.group,
      picks: found.picks.map((pick, index) => (typeof pick === 'string' && pick.trim() ? pick : template.picks[index])),
    }
  })
}

function normalizeSpecialPredictions(rawSpecial: unknown): SpecialPredictions {
  if (!rawSpecial || typeof rawSpecial !== 'object') {
    return defaultSpecialPredictions
  }

  const candidate = rawSpecial as Partial<SpecialPredictions>

  return {
    winner: typeof candidate.winner === 'string' && candidate.winner.trim() ? candidate.winner : defaultSpecialPredictions.winner,
    topScorer: typeof candidate.topScorer === 'string' && candidate.topScorer.trim() ? candidate.topScorer : defaultSpecialPredictions.topScorer,
  }
}

function normalizeKnockoutPredictions(rawKnockoutPredictions: unknown): KnockoutPredictionRound[] {
  if (!Array.isArray(rawKnockoutPredictions)) {
    return knockoutPredictionTemplates
  }

  return knockoutPredictionTemplates.map((template) => {
    const found = rawKnockoutPredictions.find(
      (item) => item && typeof item === 'object' && 'title' in item && (item as { title?: string }).title === template.title,
    ) as Partial<KnockoutPredictionRound> | undefined

    if (!found || !Array.isArray(found.picks) || found.picks.length !== template.picks.length) {
      return template
    }

    return {
      title: template.title,
      picks: found.picks.map((pick, index) => (typeof pick === 'string' && pick.trim() ? pick : template.picks[index])),
    }
  })
}

function normalizePersistedTipsState(rawTips: unknown): PersistedTipsState {
  if (Array.isArray(rawTips)) {
    return {
      fixtureTips: normalizeFixtureTips(rawTips),
      groupPlacements: groupPlacementTemplates,
      knockoutPredictions: knockoutPredictionTemplates,
      specialPredictions: defaultSpecialPredictions,
    }
  }

  if (!rawTips || typeof rawTips !== 'object') {
    return {
      fixtureTips: createDefaultFixtureTips(),
      groupPlacements: groupPlacementTemplates,
      knockoutPredictions: knockoutPredictionTemplates,
      specialPredictions: defaultSpecialPredictions,
    }
  }

  const candidate = rawTips as Partial<PersistedTipsState>

  return {
    fixtureTips: normalizeFixtureTips(candidate.fixtureTips),
    groupPlacements: normalizeGroupPlacements(candidate.groupPlacements),
    knockoutPredictions: normalizeKnockoutPredictions(candidate.knockoutPredictions),
    specialPredictions: normalizeSpecialPredictions(candidate.specialPredictions),
  }
}

const knockoutPredictionTemplates: KnockoutPredictionRound[] = [
  {
    title: 'Sextondelsfinal',
    picks: ['Vinnare Match 1: Kanada', 'Vinnare Match 2: Spanien', 'Vinnare Match 3: Argentina'],
  },
  {
    title: 'Åttondelsfinal',
    picks: ['Lag 1: Kanada', 'Lag 2: Spanien', 'Lag 3: Argentina'],
  },
  {
    title: 'Kvartsfinal',
    picks: ['Lag 1: Kanada', 'Lag 2: Argentina'],
  },
]

const myTipsSections: Array<{ title: string; count: number; status: string; items: string[] }> = [
  { title: 'Gruppspel', count: 104, status: 'Delvis låst', items: [] },
  { title: 'Gruppplaceringar', count: 12, status: 'Ändringsbar', items: ['Grupp A: Kanada, SWE/POL/ALB/UKR, Ghana, Peru'] },
  { title: 'Slutspel', count: 31, status: 'Ändringsbar', items: [] },
  { title: 'Special', count: 2, status: 'Låst vid turneringsstart', items: ['Slutsegrare: Argentina', 'Skytteligavinnare: Kylian Mbappé'] },
  { title: 'Extrafrågor', count: 5, status: 'Ändringsbar', items: [] },
]

const ruleRows: RuleRow[] = [
  {
    category: 'Gruppspelsmatcher',
    prediction: 'Exakt resultat och 1/X/2',
    lockTime: 'Vid matchstart',
  },
  {
    category: 'Gruppplaceringar',
    prediction: 'Slutlig ordning 1-4 i Grupp A-L',
    lockTime: 'Före turneringens första match',
  },
  {
    category: 'Slutspel',
    prediction: 'Lagval per slutspelsrunda',
    lockTime: 'Före första matchen i respektive runda',
  },
  {
    category: 'Slutsegrare',
    prediction: 'Vinnande lag',
    lockTime: 'Före turneringsstart',
  },
  {
    category: 'Skytteligavinnare',
    prediction: 'Spelare med flest mål',
    lockTime: 'Före turneringsstart',
  },
  {
    category: 'Extrafrågor',
    prediction: 'Frågespecifik svarstyp',
    lockTime: 'Enligt satt låstid per fråga',
  },
]

const adminQuestions = [
  {
    question: 'Vilket lag gör flest mål i Grupp A?',
    category: 'Gruppspelsfrågor',
    points: '2 p',
    lockTime: '11 juni 2026, 20.59',
    status: 'Publicerad',
  },
  {
    question: 'Hur många oavgjorda matcher blir det i åttondelsfinalerna?',
    category: 'Slutspelsfrågor',
    points: '3 p',
    lockTime: '3 juli 2026, 17.59',
    status: 'Utkast',
  },
]

function LoginPage({ onSuccess }: { onSuccess: (participant: ParticipantSession) => void }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedName = name.trim().replace(/\s+/g, ' ')
    const normalizedCode = code.trim()

    if (!normalizedName || !normalizedCode) {
      setError('Namn och åtkomstkod krävs.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: normalizedName,
          code: normalizedCode,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setError(payload.error ?? 'Ett oväntat fel inträffade. Försök igen.')
        setCode('')
        return
      }

      onSuccess({
        participantId: payload.participantId,
        name: payload.name,
      })
    } catch {
      setError('Kunde inte ansluta till servern. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <p className="eyebrow">VM2026 tipset</p>
          <h1>Åtkomst</h1>
          <p className="lead-text">Ange ditt namn och åtkomstkoden för att komma igång.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="name">Namn</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ditt namn"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="code">Åtkomstkod</label>
            <input
              id="code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Åtkomstkod"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Kontrollerar...' : 'Gå vidare'}
          </button>
        </form>
      </div>
    </div>
  )
}

function renderPage(
  activePage: PageId,
  pageProps: {
    fixtureTips: FixtureTip[]
    groupPlacements: GroupPlacement[]
    knockoutPredictions: KnockoutPredictionRound[]
    specialPredictions: SpecialPredictions
    onChangeTip: (
      match: string,
      key: 'homeScore' | 'awayScore' | 'sign',
      value: number | '' | '1' | 'X' | '2',
      source?: 'quick-score' | 'quick-sign' | 'fallback-score' | 'wheel-score',
    ) => void
    onSetScorePreset: (match: string, home: number, away: number, source?: 'quick-score' | 'fallback-score') => void
    onChangeGroupPlacement: (group: string, index: number, value: string) => void
    onChangeKnockoutPrediction: (roundTitle: string, index: number, value: string) => void
    onChangeSpecialPrediction: (key: keyof SpecialPredictions, value: string) => void
    onSaveTips: () => void
    onClearTips: () => void
    isSavingTips: boolean
    tipsSaveMessage: string
    myTipsSavedLabel: string
  },
) {
  switch (activePage) {
    case 'login':
      return null
    case 'start':
      return <StartPage />
    case 'tips':
      return (
        <TipsPage
          fixtureTips={pageProps.fixtureTips}
          groupPlacements={pageProps.groupPlacements}
          knockoutPredictions={pageProps.knockoutPredictions}
          specialPredictions={pageProps.specialPredictions}
          onChangeTip={pageProps.onChangeTip}
          onSetScorePreset={pageProps.onSetScorePreset}
          onChangeGroupPlacement={pageProps.onChangeGroupPlacement}
          onChangeKnockoutPrediction={pageProps.onChangeKnockoutPrediction}
          onChangeSpecialPrediction={pageProps.onChangeSpecialPrediction}
          onSave={pageProps.onSaveTips}
          onClear={pageProps.onClearTips}
          isSaving={pageProps.isSavingTips}
          saveMessage={pageProps.tipsSaveMessage}
        />
      )
    case 'mine':
      return (
        <MyTipsPage
          fixtureTips={pageProps.fixtureTips}
          groupPlacements={pageProps.groupPlacements}
          knockoutPredictions={pageProps.knockoutPredictions}
          specialPredictions={pageProps.specialPredictions}
          lastSavedLabel={pageProps.myTipsSavedLabel}
        />
      )
    case 'rules':
      return <RulesPage />
    case 'admin':
      return <AdminPage />
    default:
      return null
  }
}

function StartPage() {
  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">VM2026 tipset</p>
          <h1>VM2026 Tipset</h1>
          <p className="hero-text">Lägg dina tips för VM 2026 och följ turneringen hela vägen till finalen.</p>
          <div className="hero-actions">
            <button className="primary-button" type="button">Lämna tips</button>
            <button className="ghost-button" type="button">Se regler</button>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-stat">
            <span>Nedräkning</span>
            <strong>79 dagar kvar</strong>
          </div>
          <div className="hero-stat">
            <span>Senast sparad</span>
            <strong>2 minuter sedan</strong>
          </div>
          <div className="hero-stat">
            <span>Status</span>
            <strong>Inloggad</strong>
          </div>
        </div>
      </section>

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <article className="summary-card" key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Kategorier</p>
          <h2>Det här kan du tippa</h2>
        </div>
        <div className="category-grid">
          {categoryItems.map((item) => (
            <div className="category-chip" key={item.label}>
              <span className="chip-count">{item.count}</span>
              {item.label}
            </div>
          ))}
        </div>
      </section>

      <section className="panel panel-split">
        <div>
          <div className="section-heading">
            <p className="eyebrow">Framsteg</p>
            <h2>Du har fyllt i: 0%</h2>
            <p className="tips-total">0 av 154 tips inskickade</p>
          </div>
          <div className="progress-list">
            {progressItems.map((item) => (
              <div className="progress-row" key={item.label}>
                <div className="progress-label">
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="updates-card">
          <div className="section-heading compact">
            <p className="eyebrow">Senaste nytt</p>
            <h2>Adminmeddelanden</h2>
          </div>
          <ul className="updates-list">
            <li>Placeholder för nyheter och uppdateringar från admin.</li>
            <li>Allt måste vara inlämnat innan respektive låsningstid.</li>
            <li>Tips som är låsta kan inte ändras.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

function TipsPage({
  fixtureTips,
  groupPlacements,
  knockoutPredictions,
  specialPredictions,
  onChangeTip,
  onSetScorePreset,
  onChangeGroupPlacement,
  onChangeKnockoutPrediction,
  onChangeSpecialPrediction,
  onSave,
  onClear,
  isSaving,
  saveMessage,
}: {
  fixtureTips: FixtureTip[]
  groupPlacements: GroupPlacement[]
  knockoutPredictions: KnockoutPredictionRound[]
  specialPredictions: SpecialPredictions
  onChangeTip: (
    match: string,
    key: 'homeScore' | 'awayScore' | 'sign',
    value: number | '' | '1' | 'X' | '2',
    source?: 'quick-score' | 'quick-sign' | 'fallback-score' | 'wheel-score',
  ) => void
  onSetScorePreset: (match: string, home: number, away: number, source?: 'quick-score' | 'fallback-score') => void
  onChangeGroupPlacement: (group: string, index: number, value: string) => void
  onChangeKnockoutPrediction: (roundTitle: string, index: number, value: string) => void
  onChangeSpecialPrediction: (key: keyof SpecialPredictions, value: string) => void
  onSave: () => void
  onClear: () => void
  isSaving: boolean
  saveMessage: string
}) {
  const [expandedManualEditor, setExpandedManualEditor] = useState<Record<string, boolean>>({})

  const toggleManualEditor = (match: string) => {
    setExpandedManualEditor((current) => ({
      ...current,
      [match]: !current[match],
    }))
  }

  return (
    <div className="page-stack">
      <section className="panel panel-sticky-head">
        <div>
          <p className="eyebrow">Lämna tips</p>
          <h1 className="section-title">Lämna dina tips</h1>
        </div>
        <div className="inline-actions">
          <span className="save-pill">{saveMessage}</span>
          <button className="primary-button" type="button" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Sparar...' : 'Spara'}
          </button>
        </div>
      </section>

      <section className="tab-row" aria-label="Sektioner">
        {['Gruppspel', 'Gruppplaceringar', 'Slutspel', 'Special', 'Extrafrågor'].map((tab, index) => (
          <button className={index === 0 ? 'tab-button active' : 'tab-button'} key={tab} type="button">
            {tab}
          </button>
        ))}
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Gruppspel</p>
          <h2>Match för match</h2>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Match</th>
                <th>Datum/tid</th>
                <th>H - B</th>
                <th>Välj</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fixtureTips.map((row) => {
                const isLocked = row.status === 'Låst'

                return (
                <tr key={row.match}>
                  <td data-label="Match">{row.match}</td>
                  <td data-label="Datum/tid">{row.date}</td>
                  <td data-label="H - B">
                    <div className="quick-score-wrap">
                      {QUICK_SCORE_GROUPS.map((group) => (
                        <div className="quick-score-group" key={`${row.match}-${group.key}`}>
                          <span className="quick-score-group-label">{group.label}</span>
                          <div className="quick-score-grid" role="group" aria-label={`${group.label} ${row.match}`}>
                            {group.presets.map((preset) => {
                              const active = row.homeScore === preset.home && row.awayScore === preset.away
                              return (
                                <button
                                  key={`${row.match}-${group.key}-${preset.home}-${preset.away}`}
                                  type="button"
                                  className={active ? 'quick-score-button active' : 'quick-score-button'}
                                  disabled={isLocked || isSaving}
                                  onClick={() => onSetScorePreset(row.match, preset.home, preset.away, 'quick-score')}
                                >
                                  {preset.home}-{preset.away}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                      <div className="mobile-spinner-row" role="group" aria-label={`Mobil spinner ${row.match}`}>
                        <label className="spinner-field">
                          <span className="spinner-label">Hemma</span>
                          <select
                            className="wheel-select"
                            value={row.homeScore === '' ? 0 : row.homeScore}
                            disabled={isLocked || isSaving}
                            onChange={(e) => onChangeTip(row.match, 'homeScore', Number(e.target.value), 'wheel-score')}
                          >
                            {Array.from({ length: 11 }, (_, index) => (
                              <option key={`${row.match}-home-wheel-${index}`} value={index}>
                                {index}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="spinner-field">
                          <span className="spinner-label">Borta</span>
                          <select
                            className="wheel-select"
                            value={row.awayScore === '' ? 0 : row.awayScore}
                            disabled={isLocked || isSaving}
                            onChange={(e) => onChangeTip(row.match, 'awayScore', Number(e.target.value), 'wheel-score')}
                          >
                            {Array.from({ length: 11 }, (_, index) => (
                              <option key={`${row.match}-away-wheel-${index}`} value={index}>
                                {index}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <button
                        type="button"
                        className="ghost-button quick-more-button"
                        disabled={isLocked || isSaving}
                        onClick={() => toggleManualEditor(row.match)}
                      >
                        {expandedManualEditor[row.match] ? 'Stäng +More' : '+More'}
                      </button>
                      {expandedManualEditor[row.match] && (
                        <div className="score-editor">
                          <input
                            className="tip-input"
                            type="number"
                            min={0}
                            value={row.homeScore}
                            disabled={isLocked || isSaving}
                            onChange={(e) => onChangeTip(row.match, 'homeScore', e.target.value === '' ? '' : Number(e.target.value), 'fallback-score')}
                          />
                          <span>-</span>
                          <input
                            className="tip-input"
                            type="number"
                            min={0}
                            value={row.awayScore}
                            disabled={isLocked || isSaving}
                            onChange={(e) => onChangeTip(row.match, 'awayScore', e.target.value === '' ? '' : Number(e.target.value), 'fallback-score')}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td data-label="Välj">
                    <div className="sign-segment" role="group" aria-label={`Utfall ${row.match}`}>
                      {(['1', 'X', '2'] as const).map((signOption) => (
                        <button
                          key={`${row.match}-${signOption}`}
                          type="button"
                          className={row.sign === signOption ? 'segment-button active' : 'segment-button'}
                          disabled={isLocked || isSaving}
                          onClick={() => onChangeTip(row.match, 'sign', signOption, 'quick-sign')}
                        >
                          {signOption}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td data-label="Status">
                    <span className={row.status === 'Låst' ? 'status-badge locked' : 'status-badge'}>{row.status}</span>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Gruppplaceringar</p>
          <h2>Gruppplaceringar</h2>
        </div>
        <div className="group-grid">
          {groupPlacements.map((placement) => (
            <article className="group-card" key={placement.group}>
              <h3>{placement.group}</h3>
              <ol>
                {placement.picks.map((pick, index) => (
                  <li key={`${placement.group}-${index}`}>
                    <select
                      className="group-pick-input"
                      value={pick}
                      disabled={isSaving}
                      aria-label={`${placement.group} placering ${index + 1}`}
                      onChange={(e) => onChangeGroupPlacement(placement.group, index, e.target.value)}
                    >
                      <option value="">Välj lag</option>
                      {getAvailableGroupTeams(placement, index).map((team) => (
                        <option key={`${placement.group}-${index}-${team}`} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-split">
        <div>
          <div className="section-heading compact">
            <p className="eyebrow">Slutspel</p>
            <h2>Runda för runda</h2>
          </div>
          <div className="knockout-grid">
            {knockoutPredictions.map((round) => (
              <article className="round-card" key={round.title}>
                <h3>{round.title}</h3>
                <ul>
                  {round.picks.map((pick, index) => (
                    <li key={`${round.title}-${index}`}>
                      <input
                        className="special-input"
                        type="text"
                        value={pick}
                        disabled={isSaving}
                        onChange={(e) => onChangeKnockoutPrediction(round.title, index, e.target.value)}
                      />
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div>
          <div className="section-heading compact">
            <p className="eyebrow">Special och extrafrågor</p>
            <h2>Special och dynamiska frågor</h2>
          </div>
          <div className="stacked-cards">
            <article className="mini-card">
              <span className="mini-label">Slutsegrare</span>
              <input
                className="special-input"
                type="text"
                value={specialPredictions.winner}
                disabled={isSaving}
                onChange={(e) => onChangeSpecialPrediction('winner', e.target.value)}
              />
            </article>
            <article className="mini-card">
              <span className="mini-label">Skytteligavinnare</span>
              <input
                className="special-input"
                type="text"
                value={specialPredictions.topScorer}
                disabled={isSaving}
                onChange={(e) => onChangeSpecialPrediction('topScorer', e.target.value)}
              />
            </article>
            <article className="mini-card">
              <span className="mini-label">Extrafråga</span>
              <strong>Vilken grupp gör flest mål totalt?</strong>
              <span className="status-note">Låstid: 14 juni 2026, 17.59</span>
            </article>
          </div>
        </div>
      </section>

      <section className="action-bar">
        <button className="ghost-button" type="button" onClick={onClear} disabled={isSaving}>Rensa sparade</button>
        <button className="primary-button" type="button" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Sparar...' : 'Skicka in tips'}
        </button>
      </section>
    </div>
  )
}

function MyTipsPage({
  fixtureTips,
  groupPlacements,
  knockoutPredictions,
  specialPredictions,
  lastSavedLabel,
}: {
  fixtureTips: FixtureTip[]
  groupPlacements: GroupPlacement[]
  knockoutPredictions: KnockoutPredictionRound[]
  specialPredictions: SpecialPredictions
  lastSavedLabel: string
}) {
  return (
    <div className="page-stack">
      <section className="panel panel-sticky-head">
        <div>
          <p className="eyebrow">Mina tips</p>
          <h1 className="section-title">Dina inskickade tips</h1>
        </div>
        <span className="save-pill">{lastSavedLabel}</span>
      </section>

      <p className="lead-text" style={{ padding: '0 4px' }}>Här ser du exakt vad du har skickat in. Tips med status Låst kan inte redigeras.</p>

      <section className="accordion-list">
        {myTipsSections.map((section) => (
          <details className="accordion-card" key={section.title} open={section.title === 'Gruppspel'}>
            <summary>
              <strong>{section.title}</strong>
              <span className="count-badge">{section.count}</span>
            </summary>
            {section.title === 'Gruppspel' ? (
              <div className="table-wrap accordion-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Match</th>
                      <th>Datum/tid</th>
                      <th>Resultat</th>
                      <th>1/X/2</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixtureTips.map((row) => (
                      <tr key={row.match}>
                        <td data-label="Match">{row.match}</td>
                        <td data-label="Datum/tid">{row.date}</td>
                        <td data-label="Resultat">{row.homeScore === '' || row.awayScore === '' ? '—' : `${row.homeScore}-${row.awayScore}`}</td>
                        <td data-label="1/X/2">{row.sign || '—'}</td>
                        <td data-label="Status">
                          <span className={row.status === 'Låst' ? 'status-badge locked' : 'status-badge'}>
                            {row.status === 'Låst' ? 'Låst' : 'Ändringsbar'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : section.title === 'Gruppplaceringar' ? (
              <ul>
                {groupPlacements.map((group) => (
                  <li key={group.group}>{group.group}: {group.picks.join(', ')}</li>
                ))}
              </ul>
            ) : section.title === 'Slutspel' ? (
              <ul>
                {knockoutPredictions.map((round) => (
                  <li key={round.title}>{round.title}: {round.picks.join(', ')}</li>
                ))}
              </ul>
            ) : section.title === 'Special' ? (
              <ul>
                <li>Slutsegrare: {specialPredictions.winner}</li>
                <li>Skytteligavinnare: {specialPredictions.topScorer}</li>
              </ul>
            ) : section.items.length > 0 ? (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </details>
        ))}
      </section>
    </div>
  )
}

function RulesPage() {
  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Regler och låsning</p>
          <h1>Regler och låsning</h1>
        </div>
        <p className="lead-text">
          Här hittar du all information om vad du kan tippa på och när respektive kategori låses. Läs noggrant så du inte missar några viktiga deadlines!
        </p>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Låsregler</p>
          <h2>Låsregler</h2>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Vad du tippar</th>
                <th>När det låser</th>
              </tr>
            </thead>
            <tbody>
              {ruleRows.map((row) => (
                <tr key={row.category}>
                  <td data-label="Kategori">{row.category}</td>
                  <td data-label="Vad du tippar">{row.prediction}</td>
                  <td data-label="När det låser">{row.lockTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="lock-warning">
          <ul>
            <li>När en kategori eller match är låst kan den <strong>INTE</strong> ändras.</li>
            <li>Se till att skicka in dina tips i god tid före låsningstiden.</li>
            <li>Du får en varning i gränssnittet 24 timmar innan något låses.</li>
            <li>Kontrollera regelbundet för eventuella schemaändringar.</li>
          </ul>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">FAQ</p>
          <h2>Vanliga frågor</h2>
        </div>
        <div className="faq-grid">
          <article className="mini-card">
            <strong>Vad händer om ett lag ännu inte är fastställt?</strong>
            <p>Om ett lag visas som en placeholder (t.ex. DEN/MKD/CZE/IRL) gäller ditt tips på den platsen tills FIFA fastställer laget.</p>
          </article>
          <article className="mini-card">
            <strong>Kan jag ändra tips efter att jag skickat in?</strong>
            <p>Ja, du kan ändra dina tips fram till respektive låsningstid. När en kategori eller match är låst kan den inte längre ändras.</p>
          </article>
          <article className="mini-card">
            <strong>Hur räknas poäng?</strong>
            <p>Poängsystemet definieras av admin och kan variera per kategori. Exakta resultat ger oftast högre poäng än rätt 1/X/2.</p>
          </article>
          <article className="mini-card">
            <strong>Vad händer om en match flyttas eller ställs in?</strong>
            <p>Vid schemaändringar justeras låsningstiden automatiskt. Vid inställda matcher återfås tipsen och ingen poäng räknas.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Turneringen</p>
          <h2>Turneringsinformation</h2>
        </div>
        <div className="tournament-info-grid">
          <article className="info-card">
            <span className="mini-label">Turneringsstart</span>
            <strong>11 juni 2026, 18:00 CET</strong>
          </article>
          <article className="info-card">
            <span className="mini-label">Final</span>
            <strong>19 juli 2026</strong>
          </article>
          <article className="info-card">
            <span className="mini-label">Antal matcher</span>
            <strong>104 matcher totalt</strong>
          </article>
          <article className="info-card">
            <span className="mini-label">Värdländer</span>
            <strong>USA, Mexiko, Kanada</strong>
          </article>
        </div>
      </section>
    </div>
  )
}

function AdminPage() {
  return (
    <div className="page-stack">
      <section className="panel panel-split">
        <div>
          <div className="section-heading">
            <p className="eyebrow">Adminfrågor</p>
            <h1>Adminfrågor</h1>
          </div>
          <p className="lead-text">
            Admin behöver kunna skapa, publicera och låsa frågor med tydlig kategori, poäng och tidpunkt.
          </p>
        </div>
        <article className="mini-card emphasis">
          <span className="mini-label">Status</span>
          <strong>1 fråga publicerad, 1 utkast</strong>
          <p>Snabb översikt över vilka frågor som syns för användarna just nu.</p>
        </article>
      </section>

      <section className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fråga</th>
                <th>Kategori</th>
                <th>Poäng</th>
                <th>Låstid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {adminQuestions.map((question) => (
                <tr key={question.question}>
                  <td data-label="Fråga">{question.question}</td>
                  <td data-label="Kategori">{question.category}</td>
                  <td data-label="Poäng">{question.points}</td>
                  <td data-label="Låstid">{question.lockTime}</td>
                  <td data-label="Status">
                    <span className={question.status === 'Publicerad' ? 'status-badge' : 'status-badge locked'}>
                      {question.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="form-grid">
        <article className="mini-card">
          <span className="mini-label">Skapa fråga</span>
          <h2>Formulärfält</h2>
          <ul>
            <li>Frågetext</li>
            <li>Kategori</li>
            <li>Svarsalternativ</li>
            <li>Rätt svar</li>
            <li>Poäng</li>
            <li>Låstid</li>
            <li>Status</li>
          </ul>
        </article>
        <article className="mini-card">
          <span className="mini-label">Adminåtgärder</span>
          <div className="stacked-actions">
            <button className="ghost-button" type="button">Spara utkast</button>
            <button className="primary-button" type="button">Publicera</button>
            <button className="ghost-button danger" type="button">Avpublicera</button>
          </div>
        </article>
      </section>
    </div>
  )
}

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [participant, setParticipant] = useState<ParticipantSession | null>(null)
  const [activePage, setActivePage] = useState<PageId>('start')
  const [fixtureTips, setFixtureTips] = useState<FixtureTip[]>(createDefaultFixtureTips())
  const [groupPlacements, setGroupPlacements] = useState<GroupPlacement[]>(groupPlacementTemplates)
  const [knockoutPredictions, setKnockoutPredictions] = useState<KnockoutPredictionRound[]>(knockoutPredictionTemplates)
  const [specialPredictions, setSpecialPredictions] = useState<SpecialPredictions>(defaultSpecialPredictions)
  const [isTipsSaving, setIsTipsSaving] = useState(false)
  const [tipsSaveMessage, setTipsSaveMessage] = useState('Inte sparad ännu')
  const [myTipsSavedLabel, setMyTipsSavedLabel] = useState('Senast uppdaterad: inte sparad')

  useEffect(() => {
    try {
      const rawParticipant = localStorage.getItem(PARTICIPANT_STORAGE_KEY)
      if (!rawParticipant) {
        return
      }

      const parsed = JSON.parse(rawParticipant) as ParticipantSession

      if (parsed?.participantId && parsed?.name) {
        setParticipant(parsed)
        setIsLoggedIn(true)
      }
    } catch {
      localStorage.removeItem(PARTICIPANT_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (!participant) {
      localStorage.removeItem(PARTICIPANT_STORAGE_KEY)
      return
    }

    localStorage.setItem(PARTICIPANT_STORAGE_KEY, JSON.stringify(participant))
  }, [participant])

  useEffect(() => {
    if (!participant) {
      setFixtureTips(createDefaultFixtureTips())
      setGroupPlacements(groupPlacementTemplates)
      setKnockoutPredictions(knockoutPredictionTemplates)
      setSpecialPredictions(defaultSpecialPredictions)
      setTipsSaveMessage('Inte sparad ännu')
      setMyTipsSavedLabel('Senast uppdaterad: inte sparad')
      return
    }

    const loadTips = async () => {
      try {
        const response = await fetch(`/api/tips/${participant.participantId}`)
        if (!response.ok) {
          setTipsSaveMessage('Kunde inte hämta sparade tips')
          return
        }

        const payload = await response.json()
        const normalizedState = normalizePersistedTipsState(payload.tips)
        setFixtureTips(normalizedState.fixtureTips)
        setGroupPlacements(normalizedState.groupPlacements)
        setKnockoutPredictions(normalizedState.knockoutPredictions)
        setSpecialPredictions(normalizedState.specialPredictions)

        if (payload.updatedAt) {
          const formatted = new Date(payload.updatedAt).toLocaleString('sv-SE')
          setTipsSaveMessage(`Sparad: ${formatted}`)
          setMyTipsSavedLabel(`Senast uppdaterad: ${formatted}`)
        } else {
          setTipsSaveMessage('Inte sparad ännu')
          setMyTipsSavedLabel('Senast uppdaterad: inte sparad')
        }
      } catch {
        setTipsSaveMessage('Kunde inte hämta sparade tips')
      }
    }

    loadTips()
  }, [participant])

  const onChangeGroupPlacement = (group: string, index: number, value: string) => {
    setGroupPlacements((current) =>
      current.map((item) => {
        if (item.group !== group) {
          return item
        }

        const nextPicks = [...item.picks]
        const previousValue = nextPicks[index]

        if (!value) {
          nextPicks[index] = ''

          return {
            ...item,
            picks: nextPicks,
          }
        }

        const existingIndex = nextPicks.findIndex((pick, pickIndex) => pickIndex !== index && pick === value)

        if (existingIndex >= 0) {
          nextPicks[existingIndex] = previousValue
        }

        nextPicks[index] = value

        return {
          ...item,
          picks: nextPicks,
        }
      }),
    )
  }

  const onChangeSpecialPrediction = (key: keyof SpecialPredictions, value: string) => {
    setSpecialPredictions((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const onChangeKnockoutPrediction = (roundTitle: string, index: number, value: string) => {
    setKnockoutPredictions((current) =>
      current.map((round) => {
        if (round.title !== roundTitle) {
          return round
        }

        return {
          ...round,
          picks: round.picks.map((pick, pickIndex) => (pickIndex === index ? value : pick)),
        }
      }),
    )
  }

  const onChangeTip = (
    match: string,
    key: 'homeScore' | 'awayScore' | 'sign',
    value: number | '' | '1' | 'X' | '2',
    source: 'quick-score' | 'quick-sign' | 'fallback-score' | 'wheel-score' = 'quick-score',
  ) => {
    setFixtureTips((current) =>
      current.map((tip) => {
        if (tip.match !== match || tip.status === 'Låst') {
          return tip
        }

        if (key === 'homeScore' || key === 'awayScore') {
          const nextHomeScore = key === 'homeScore' ? (value as number | '') : tip.homeScore
          const nextAwayScore = key === 'awayScore' ? (value as number | '') : tip.awayScore

          return {
            ...tip,
            [key]: value,
            sign: deriveSignFromScore(nextHomeScore, nextAwayScore),
          }
        }

        return {
          ...tip,
          [key]: value,
        }
      }),
    )
  }

  const onSetScorePreset = (match: string, home: number, away: number, source: 'quick-score' | 'fallback-score' = 'quick-score') => {
    setFixtureTips((current) =>
      current.map((tip) => {
        if (tip.match !== match || tip.status === 'Låst') {
          return tip
        }

        return {
          ...tip,
          homeScore: home,
          awayScore: away,
          sign: deriveSignFromScore(home, away),
        }
      }),
    )
  }

  const onSaveTips = async () => {
    if (!participant) {
      return
    }

    setIsTipsSaving(true)
    setTipsSaveMessage('Sparar...')

    try {
      const response = await fetch(`/api/tips/${participant.participantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tips: {
            fixtureTips,
            groupPlacements,
            knockoutPredictions,
            specialPredictions,
          },
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        setTipsSaveMessage(payload.error ?? 'Kunde inte spara tips')
        return
      }

      const normalizedState = normalizePersistedTipsState(payload.tips)
      setFixtureTips(normalizedState.fixtureTips)
      setGroupPlacements(normalizedState.groupPlacements)
      setKnockoutPredictions(normalizedState.knockoutPredictions)
      setSpecialPredictions(normalizedState.specialPredictions)
      const formatted = payload.updatedAt ? new Date(payload.updatedAt).toLocaleString('sv-SE') : new Date().toLocaleString('sv-SE')
      setTipsSaveMessage(`Sparad: ${formatted}`)
      setMyTipsSavedLabel(`Senast uppdaterad: ${formatted}`)
    } catch {
      setTipsSaveMessage('Kunde inte spara tips')
    } finally {
      setIsTipsSaving(false)
    }
  }

  const onClearTips = async () => {
    if (!participant) {
      return
    }

    setIsTipsSaving(true)

    try {
      const response = await fetch(`/api/tips/${participant.participantId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        setTipsSaveMessage('Kunde inte rensa tips')
        return
      }

      setFixtureTips(createDefaultFixtureTips())
      setGroupPlacements(groupPlacementTemplates)
      setKnockoutPredictions(knockoutPredictionTemplates)
      setSpecialPredictions(defaultSpecialPredictions)
      setTipsSaveMessage('Sparade tips rensade')
      setMyTipsSavedLabel('Senast uppdaterad: inte sparad')
    } catch {
      setTipsSaveMessage('Kunde inte rensa tips')
    } finally {
      setIsTipsSaving(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="app-shell">
        <LoginPage
          onSuccess={(nextParticipant) => {
            setParticipant(nextParticipant)
            setIsLoggedIn(true)
            setActivePage('start')
          }}
        />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <p className="brand-kicker">VM2026</p>
          <span className="brand-title">Tipset</span>
        </div>

        <nav className="nav-tabs" aria-label="Huvudnavigation">
          {navItems.map((item) => (
            <button
              className={item.id === activePage ? 'nav-button active' : 'nav-button'}
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="utility-panel">
          <div>
            <span className="utility-label">Inloggad som</span>
            <strong>{participant?.name ?? 'Deltagare'}</strong>
          </div>
          <div>
            <span className="utility-label">Nedräkning</span>
            <strong>79 dagar kvar</strong>
          </div>
          <div>
            <span className="utility-label">Senast sparad</span>
            <strong>{tipsSaveMessage.replace('Sparad: ', '')}</strong>
          </div>
        </div>
      </header>

      <main className="content-shell">
        {renderPage(activePage, {
          fixtureTips,
          groupPlacements,
          knockoutPredictions,
          specialPredictions,
          onChangeTip,
          onSetScorePreset,
          onChangeGroupPlacement,
          onChangeKnockoutPrediction,
          onChangeSpecialPrediction,
          onSaveTips,
          onClearTips,
          isSavingTips: isTipsSaving,
          tipsSaveMessage,
          myTipsSavedLabel,
        })}
      </main>
    </div>
  )
}