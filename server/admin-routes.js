/**
 * Admin routes: questions and results management
 */

import {
    createAdminQuestion,
    deleteAdminQuestion,
    getAdminQuestionById,
    getMatchResultById,
    getQuestionAnswers,
    listAdminQuestions,
    listMatchResults,
    updateAdminQuestion,
    upsertMatchResult,
} from './db.js'
import {
    parseEntityId,
    parseMatchId,
    normalizeAdminQuestionPayload,
    normalizeMatchResultPayload,
} from './validators.js'

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

    app.post('/api/admin/questions', async (req, res) => {
        const questionPayload = normalizeAdminQuestionPayload(req.body)
        if (!questionPayload) {
            res.status(400).json({ error: 'Ogiltigt adminfråga-format.' })
            return
        }

        try {
            const createdQuestion = await createAdminQuestion(questionPayload)
            res.status(201).json(createdQuestion)
        } catch (error) {
            console.error('Admin question create error:', error)
            res.status(500).json({ error: 'Kunde inte skapa adminfråga.' })
        }
    })

    app.put('/api/admin/questions/:id', async (req, res) => {
        const questionId = parseEntityId(req.params.id)
        if (!questionId) {
            res.status(400).json({ error: 'Ogiltigt fråga-id.' })
            return
        }

        const questionPayload = normalizeAdminQuestionPayload(req.body)
        if (!questionPayload) {
            res.status(400).json({ error: 'Ogiltigt adminfråga-format.' })
            return
        }

        try {
            const existingQuestion = await getAdminQuestionById(questionId)
            if (!existingQuestion) {
                res.status(404).json({ error: 'Fråga hittades inte.' })
                return
            }

            const updatedQuestion = await updateAdminQuestion(questionId, questionPayload)
            res.json(updatedQuestion)
        } catch (error) {
            console.error('Admin question update error:', error)
            res.status(500).json({ error: 'Kunde inte uppdatera adminfråga.' })
        }
    })

    app.delete('/api/admin/questions/:id', async (req, res) => {
        const questionId = parseEntityId(req.params.id)
        if (!questionId) {
            res.status(400).json({ error: 'Ogiltigt fråga-id.' })
            return
        }

        try {
            const existingQuestion = await getAdminQuestionById(questionId)
            if (!existingQuestion) {
                res.status(404).json({ error: 'Fråga hittades inte.' })
                return
            }

            await deleteAdminQuestion(questionId)
            res.status(204).end()
        } catch (error) {
            console.error('Admin question delete error:', error)
            res.status(500).json({ error: 'Kunde inte ta bort adminfråga.' })
        }
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
}

export { createAdminRoutes }
