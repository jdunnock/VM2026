import { ruleRows } from '../constants'

export function RulesPage({
    phase,
    globalDeadlineLabel,
}: {
    phase: 'B' | 'C'
    globalDeadlineLabel: string
}) {
    const isTrackingPhase = phase === 'C'

    return (
        <div className="page-stack">
            <section className="panel panel-sticky-head page-hero">
                <div>
                    <p className="eyebrow">Regler och låsning</p>
                    <h1 className="section-title">Regler och låsning</h1>
                    <p className="lead-text" style={{ margin: 0 }}>
                        Här hittar du all information om vad du kan tippa på och den gemensamma deadline som gäller för alla kategorier.
                    </p>
                </div>
                <span className="save-pill">{isTrackingPhase ? 'Fas C' : 'Fas B'}</span>
            </section>

            <section className="panel">
                <div className="section-heading compact">
                    <p className="eyebrow">Fasguide</p>
                    <h2>{isTrackingPhase ? 'Fas C: Turneringen pågår' : 'Fas B: Tipsperioden är öppen'}</h2>
                </div>
                {isTrackingPhase ? (
                    <div className="lock-warning">
                        <ul>
                            <li>Tips och extrafrågor är låsta efter deadline.</li>
                            <li>Fokus ligger på resultat, poäng och topplista.</li>
                            <li>Poängdetaljer visas i `Mina tips` och `Resultat & poäng`.</li>
                        </ul>
                    </div>
                ) : (
                    <div className="lock-warning">
                        <ul>
                            <li>Du kan fortfarande redigera och spara dina tips.</li>
                            <li>Kontrollera att alla kategorier är ifyllda före deadline.</li>
                            <li>Poängvisning öppnas först i Fas C när turneringen är igång.</li>
                        </ul>
                    </div>
                )}
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
                        <li>Gemensam deadline för allt är <strong>{globalDeadlineLabel}</strong>.</li>
                        <li>Se till att skicka in dina tips i god tid före den tiden.</li>
                        <li>Efter deadline är alla tips och extrafrågor låsta.</li>
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
                        <strong>Är alla VM-lag nu fastställda?</strong>
                        <p>Ja. FIFA har nu bekräftat samtliga 48 lag, så gruppspelet visas utan kval-platshållare.</p>
                    </article>
                    <article className="mini-card">
                        <strong>Kan jag ändra tips efter att jag skickat in?</strong>
                        <p>Ja, du kan ändra dina tips fram till den gemensamma deadlinen. Efter deadline kan inga tips längre ändras.</p>
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
