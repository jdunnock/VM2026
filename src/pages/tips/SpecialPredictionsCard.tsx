import type { SpecialPredictions } from '../../types'

type SpecialPredictionsCardProps = {
  specialPredictions: SpecialPredictions
  onChangeSpecialPrediction: (key: keyof SpecialPredictions, value: string) => void
  isSaving: boolean
  isGlobalLockActive: boolean
}

export function SpecialPredictionsCard({
  specialPredictions,
  onChangeSpecialPrediction,
  isSaving,
  isGlobalLockActive,
}: SpecialPredictionsCardProps) {
  return (
    <section className="panel">
      <div className="section-heading compact">
        <p className="eyebrow">Special</p>
        <h2>Specialfrågor</h2>
      </div>
      <div className="stacked-cards">
        <article className="mini-card">
          <span className="mini-label">Slutsegrare</span>
          <input
            className="special-input"
            type="text"
            value={specialPredictions.winner}
            disabled={isSaving || isGlobalLockActive}
            onChange={(e) => onChangeSpecialPrediction('winner', e.target.value)}
          />
        </article>
        <article className="mini-card">
          <span className="mini-label">Skytteligavinnare</span>
          <input
            className="special-input"
            type="text"
            value={specialPredictions.topScorer}
            disabled={isSaving || isGlobalLockActive}
            onChange={(e) => onChangeSpecialPrediction('topScorer', e.target.value)}
          />
        </article>
      </div>
    </section>
  )
}
