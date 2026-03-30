/**
 * Public routes: health, config, results, leaderboard, questions
 */

import {
    getMatchResultById,
    getParticipantScoreByParticipantId,
    listMatchResults,
    listParticipantScores,
    listPublishedAdminQuestions,
    findParticipantById,
    buildGroupStandingsLookups,
    buildKnockoutRoundLookups,
    buildPublishedQuestionLookups,
} from './db.js'
import { parseParticipantId, parseMatchId } from './validators.js'

function createPublicRoutes(app, globalDeadline) {
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok' })
    })

    app.get('/api/config', (_req, res) => {
        res.json({ globalDeadline })
    })

    app.get('/api/results', async (_req, res) => {
        try {
            const results = await listMatchResults()
            res.json({ results })
        } catch (error) {
            console.error('Results read error:', error)
            res.status(500).json({ error: 'Kunde inte hämta matchresultat.' })
        }
    })

    app.get('/api/results/correctness', async (_req, res) => {
        try {
            const [groupStandingsLookups, knockoutRoundLookups, questionLookups] = await Promise.all([
                buildGroupStandingsLookups(),
                buildKnockoutRoundLookups(),
                buildPublishedQuestionLookups(),
            ])

            const groupStandings = {}
            for (const [groupCode, standing] of groupStandingsLookups.byGroup.entries()) {
                groupStandings[groupCode] = {
                    settled: standing.settled,
                    actualPicks: standing.actualPicks,
                }
            }

            const knockoutRounds = {}
            for (const [round, lookup] of knockoutRoundLookups.byRound.entries()) {
                knockoutRounds[round] = {
                    settled: lookup.settled,
                    actualTeams: lookup.actualTeams,
                }
            }

            const extraAnswers = {}
            for (const [id, question] of questionLookups.byId.entries()) {
                extraAnswers[id] = {
                    correctAnswer: question.correctAnswer || null,
                    settled: Boolean(question.correctAnswer),
                    acceptedAnswers: Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [],
                }
            }

            res.json({ groupStandings, knockoutRounds, extraAnswers })
        } catch (error) {
            console.error('Correctness data read error:', error)
            res.status(500).json({ error: 'Kunde inte hämta rättningsdata.' })
        }
    })

    app.get('/api/results/:matchId', async (req, res) => {
        const matchId = parseMatchId(req.params.matchId)
        if (!matchId) {
            res.status(400).json({ error: 'Ogiltigt match-id.' })
            return
        }

        try {
            const result = await getMatchResultById(matchId)
            if (!result) {
                res.status(404).json({ error: 'Matchresultat hittades inte.' })
                return
            }

            res.json(result)
        } catch (error) {
            console.error('Result read error:', error)
            res.status(500).json({ error: 'Kunde inte hämta matchresultat.' })
        }
    })

    app.get('/api/scores', async (_req, res) => {
        try {
            const scores = await listParticipantScores()
            res.json({ scores })
        } catch (error) {
            console.error('Scores read error:', error)
            res.status(500).json({ error: 'Kunde inte hämta poäng.' })
        }
    })

    app.get('/api/scores/:participantId', async (req, res) => {
        const participantId = parseParticipantId(req.params.participantId)

        if (!participantId) {
            res.status(400).json({ error: 'Ogiltigt participantId.' })
            return
        }

        try {
            const participant = await findParticipantById(participantId)
            if (!participant) {
                res.status(404).json({ error: 'Deltagare hittades inte.' })
                return
            }

            const score = await getParticipantScoreByParticipantId(participantId)
            res.json(score)
        } catch (error) {
            console.error('Participant score read error:', error)
            res.status(500).json({ error: 'Kunde inte hämta deltagarens poäng.' })
        }
    })

    app.get('/api/questions/published', async (_req, res) => {
        try {
            const questions = await listPublishedAdminQuestions()
            res.json({ questions })
        } catch (error) {
            console.error('Published questions read error:', error)
            res.status(500).json({ error: 'Kunde inte hämta publicerade frågor.' })
        }
    })
}

export { createPublicRoutes }
