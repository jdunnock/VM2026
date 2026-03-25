import crypto from 'node:crypto'
import express from 'express'
import { createParticipant, findParticipantByName, initDatabase, touchParticipant } from './db.js'

const app = express()
const port = Number(process.env.API_PORT ?? 4174)
const salt = process.env.ACCESS_CODE_SALT ?? 'vm2026-local-salt'

function hashAccessCode(code) {
  return crypto.scryptSync(code, salt, 64).toString('hex')
}

function normalizeName(name) {
  return name.trim().replace(/\s+/g, ' ')
}

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/auth/sign-in', async (req, res) => {
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

initDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`VM2026 API listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  })
