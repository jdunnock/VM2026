/**
 * Tips routes: participant prediction CRUD
 */

import {
    deleteTipsByParticipantId,
    findParticipantById,
    getTipsByParticipantId,
    listParticipantsWithTips,
    upsertTipsByParticipantId,
} from './db.js'
import { parseParticipantId, normalizeTipsPayload } from './validators.js'

function createTipsRoutes(app) {
    app.get('/api/tips/all', async (_req, res) => {
        try {
            const participants = await listParticipantsWithTips()
            res.json({ participants })
        } catch (error) {
            console.error('All tips read error:', error)
            res.status(500).json({ error: 'Kunde inte hämta alla tips.' })
        }
    })

    app.get('/api/tips/:participantId', async (req, res) => {
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

            const tipsState = await getTipsByParticipantId(participantId)
            res.json({
                participantId,
                tips: tipsState?.tips ?? [],
                updatedAt: tipsState?.updatedAt ?? null,
            })
        } catch (error) {
            console.error('Tips read error:', error)
            res.status(500).json({ error: 'Kunde inte hämta tips.' })
        }
    })

    app.put('/api/tips/:participantId', async (req, res) => {
        const participantId = parseParticipantId(req.params.participantId)

        if (!participantId) {
            res.status(400).json({ error: 'Ogiltigt participantId.' })
            return
        }

        const tipsPayload = normalizeTipsPayload(req.body?.tips)
        if (!tipsPayload) {
            res.status(400).json({ error: 'Ogiltigt tipsformat.' })
            return
        }

        try {
            const participant = await findParticipantById(participantId)
            if (!participant) {
                res.status(404).json({ error: 'Deltagare hittades inte.' })
                return
            }

            const savedState = await upsertTipsByParticipantId(participantId, tipsPayload)

            res.json({
                participantId,
                tips: savedState?.tips ?? [],
                updatedAt: savedState?.updatedAt ?? null,
            })
        } catch (error) {
            console.error('Tips save error:', error)
            res.status(500).json({ error: 'Kunde inte spara tips.' })
        }
    })

    app.delete('/api/tips/:participantId', async (req, res) => {
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

            await deleteTipsByParticipantId(participantId)
            res.status(204).end()
        } catch (error) {
            console.error('Tips delete error:', error)
            res.status(500).json({ error: 'Kunde inte rensa tips.' })
        }
    })
}

export { createTipsRoutes }
