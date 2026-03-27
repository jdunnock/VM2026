/**
 * Authentication routes
 */

import {
    createParticipant,
    findParticipantById,
    findParticipantByName,
    touchParticipant,
} from './db.js'
import { hashAccessCode, normalizeName, adminAccessCode, adminAccessName } from './middleware.js'

function createAuthRoutes(app, authRateLimit) {
    app.post('/api/auth/admin-sign-in', authRateLimit, (req, res) => {
        const rawName = typeof req.body?.name === 'string' ? req.body.name : ''
        const rawCode = typeof req.body?.code === 'string' ? req.body.code : ''

        const name = normalizeName(rawName)
        const code = rawCode.trim()

        if (!name || !code) {
            res.status(400).json({ error: 'Adminnamn och adminkod krävs.' })
            return
        }

        const isNameValid = name.toLowerCase() === adminAccessName.toLowerCase()
        const isCodeValid = code === adminAccessCode

        if (!isNameValid || !isCodeValid) {
            res.status(401).json({ error: 'Fel adminnamn eller adminkod.' })
            return
        }

        res.json({ adminName: adminAccessName })
    })

    app.post('/api/auth/sign-in', authRateLimit, async (req, res) => {
        const rawName = typeof req.body?.name === 'string' ? req.body.name : ''
        const rawCode = typeof req.body?.code === 'string' ? req.body.code : ''

        const name = normalizeName(rawName)
        const code = rawCode.trim()

        if (!name || !code) {
            res.status(400).json({ error: 'Namn och åtkomstkod krävs.' })
            return
        }

        try {
            const existingParticipant = await findParticipantByName(name)
            const codeHash = hashAccessCode(code)

            if (!existingParticipant) {
                const createdParticipant = await createParticipant(name, codeHash)
                res.status(201).json({ participantId: createdParticipant.id, name: createdParticipant.name })
                return
            }

            if (existingParticipant.access_code_hash !== codeHash) {
                res.status(401).json({ error: 'Fel kod. Försök igen.' })
                return
            }

            await touchParticipant(existingParticipant.id)

            res.json({ participantId: existingParticipant.id, name: existingParticipant.name })
        } catch (error) {
            console.error('Sign-in error:', error)
            res.status(500).json({ error: 'Ett oväntat fel inträffade. Försök igen.' })
        }
    })
}

export { createAuthRoutes }
