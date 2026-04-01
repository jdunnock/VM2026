/**
 * Admin routes: questions and results management
 */

import {
    getAdminQuestionById,
    getQuestionAnswers,
    listAdminQuestions,
    listMatchResults,
    updateAdminQuestion,
    upsertMatchResult,
    listKnockoutAdvancements,
    listKnockoutAdvancementsByRound,
    upsertKnockoutAdvancement,
    deleteKnockoutAdvancement,
} from './db.js'
import { parseEntityId, parseMatchId, normalizeMatchResultPayload } from './validators.js'

function createAdminRoutes(app) {
    app.get('/api/admin/questions', async (_req, res) => {
        try {
            const questions = await listAdminQuestions()
            res.json({ questions })
        } catch (error) {
            console.error('Admin questions read error:', error)
            res.status(500).json({ error: 'Kunde inte hämta adminfrågor.' })
        }
    })

    app.get('/api/admin/results', async (_req, res) => {
        try {
            const results = await listMatchResults()
            res.json({ results })
        } catch (error) {
            console.error('Admin results read error:', error)
            res.status(500).json({ error: 'Kunde inte hämta adminresultat.' })
        }
    })

    app.put('/api/admin/results/:matchId', async (req, res) => {
        const matchId = parseMatchId(req.params.matchId)
        if (!matchId) {
            res.status(400).json({ error: 'Ogiltigt match-id.' })
            return
        }

        const resultPayload = normalizeMatchResultPayload(req.body, matchId)
        if (!resultPayload) {
            res.status(400).json({ error: 'Ogiltigt matchresultat-format.' })
            return
        }

        try {
            const savedResult = await upsertMatchResult(resultPayload)
            res.json(savedResult)
        } catch (error) {
            console.error('Admin result upsert error:', error)
            res.status(500).json({ error: 'Kunde inte spara matchresultat.' })
        }
    })

    app.post('/api/admin/questions', async (_req, res) => {
        res.status(405).json({ error: 'Frågestrukturen hanteras via manifest och kan inte skapas här.' })
    })

    app.put('/api/admin/questions/:id', async (_req, res) => {
        res.status(405).json({ error: 'Frågestrukturen hanteras via manifest och kan inte redigeras här.' })
    })

    app.delete('/api/admin/questions/:id', async (_req, res) => {
        res.status(405).json({ error: 'Frågestrukturen hanteras via manifest och kan inte tas bort här.' })
    })

    app.get('/api/admin/questions/:id/answers', async (req, res) => {
        const questionId = parseEntityId(req.params.id)
        if (!questionId) {
            res.status(400).json({ error: 'Ogiltigt fråga-id.' })
            return
        }

        try {
            const question = await getAdminQuestionById(questionId)
            if (!question) {
                res.status(404).json({ error: 'Fråga hittades inte.' })
                return
            }

            const answers = await getQuestionAnswers(questionId)
            res.json({ answers, acceptedAnswers: question.acceptedAnswers, correctAnswer: question.correctAnswer })
        } catch (error) {
            console.error('Admin question answers error:', error)
            res.status(500).json({ error: 'Kunde inte hämta svar.' })
        }
    })

    app.put('/api/admin/questions/:id/accepted-answers', async (req, res) => {
        const questionId = parseEntityId(req.params.id)
        if (!questionId) {
            res.status(400).json({ error: 'Ogiltigt fråga-id.' })
            return
        }

        const acceptedAnswers = Array.isArray(req.body.acceptedAnswers)
            ? req.body.acceptedAnswers.filter((a) => typeof a === 'string' && a.trim().length > 0 && a.trim().length <= 200)
            : []

        const correctAnswer = typeof req.body.correctAnswer === 'string' ? req.body.correctAnswer.trim() : undefined

        try {
            const question = await getAdminQuestionById(questionId)
            if (!question) {
                res.status(404).json({ error: 'Fråga hittades inte.' })
                return
            }

            const updated = await updateAdminQuestion(questionId, {
                ...question,
                acceptedAnswers,
                ...(correctAnswer !== undefined ? { correctAnswer } : {}),
            })
            res.json(updated)
        } catch (error) {
            console.error('Admin accepted answers update error:', error)
            res.status(500).json({ error: 'Kunde inte uppdatera godkända svar.' })
        }
    })

    // ─── Knockout advancement ────────────────────────────────────────

    app.get('/api/admin/knockout-advancement', async (req, res) => {
        try {
            const round = typeof req.query.round === 'string' ? req.query.round : null
            const advancements = round
                ? await listKnockoutAdvancementsByRound(round)
                : await listKnockoutAdvancements()
            res.json({ advancements })
        } catch (error) {
            console.error('Admin knockout advancement read error:', error)
            res.status(500).json({ error: 'Kunde inte hämta slutspelsteam.' })
        }
    })

    app.put('/api/admin/knockout-advancement', async (req, res) => {
        const { round, teamName, confirmedAt, source } = req.body ?? {}
        if (typeof round !== 'string' || typeof teamName !== 'string' || !teamName.trim()) {
            res.status(400).json({ error: 'Ogiltig rund eller lagnamn.' })
            return
        }

        try {
            const result = await upsertKnockoutAdvancement({
                round,
                teamName: teamName.trim(),
                confirmedAt: typeof confirmedAt === 'string' ? confirmedAt : undefined,
                source: typeof source === 'string' ? source : undefined,
            })
            res.json(result)
        } catch (error) {
            console.error('Admin knockout advancement upsert error:', error)
            res.status(500).json({ error: 'Kunde inte spara slutspelsteam.' })
        }
    })

    app.delete('/api/admin/knockout-advancement', async (req, res) => {
        const { round, teamName } = req.body ?? {}
        if (typeof round !== 'string' || typeof teamName !== 'string') {
            res.status(400).json({ error: 'Ogiltig rund eller lagnamn.' })
            return
        }

        try {
            await deleteKnockoutAdvancement(round, teamName.trim())
            res.status(204).end()
        } catch (error) {
            console.error('Admin knockout advancement delete error:', error)
            res.status(500).json({ error: 'Kunde inte ta bort slutspelsteam.' })
        }
    })
}

export { createAdminRoutes }
