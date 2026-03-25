import crypto from 'node:crypto'
import express from 'express'
import {
  createParticipant,
  deleteTipsByParticipantId,
  findParticipantById,
  findParticipantByName,
  getTipsByParticipantId,
  initDatabase,
  touchParticipant,
  upsertTipsByParticipantId,
} from './db.js'

const app = express()
const port = Number(process.env.API_PORT ?? 4174)
const salt = process.env.ACCESS_CODE_SALT ?? 'vm2026-local-salt'

function hashAccessCode(code) {
  return crypto.scryptSync(code, salt, 64).toString('hex')
}

function normalizeName(name) {
  return name.trim().replace(/\s+/g, ' ')
}

function parseParticipantId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function isValidTipsPayload(tips) {
  if (!Array.isArray(tips) || tips.length > 200) {
    return false
  }

  return tips.every((tip) => {
    if (!tip || typeof tip !== 'object') {
      return false
    }

    const isMatchValid = typeof tip.match === 'string' && tip.match.trim().length > 0
    const isDateValid = typeof tip.date === 'string' && tip.date.trim().length > 0
    const isSignValid = typeof tip.sign === 'string' && ['1', 'X', '2', ''].includes(tip.sign)
    const isStatusValid = typeof tip.status === 'string' && tip.status.trim().length > 0

    const hasValidScore =
      (tip.homeScore === '' || Number.isInteger(tip.homeScore)) &&
      (tip.awayScore === '' || Number.isInteger(tip.awayScore))

    return isMatchValid && isDateValid && isSignValid && isStatusValid && hasValidScore
  })
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

  const tips = req.body?.tips
  if (!isValidTipsPayload(tips)) {
    res.status(400).json({ error: 'Ogiltigt tipsformat.' })
    return
  }

  try {
    const participant = await findParticipantById(participantId)
    if (!participant) {
      res.status(404).json({ error: 'Deltagare hittades inte.' })
      return
    }

    const savedState = await upsertTipsByParticipantId(participantId, tips)

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
