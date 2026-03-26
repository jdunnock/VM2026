import crypto from 'node:crypto'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import {
  createAdminQuestion,
  createParticipant,
  deleteAdminQuestion,
  deleteTipsByParticipantId,
  findParticipantById,
  findParticipantByName,
  getParticipantScoreByParticipantId,
  getAdminQuestionById,
  getMatchResultById,
  getSpecialResults,
  getTipsByParticipantId,
  initDatabase,
  listAdminQuestions,
  listMatchResults,
  listParticipantScores,
  listPublishedAdminQuestions,
  touchParticipant,
  updateAdminQuestion,
  upsertMatchResult,
  upsertSpecialResults,
  upsertTipsByParticipantId,
} from './db.js'

const app = express()
const port = Number(process.env.API_PORT ?? 4174)
const isProduction = process.env.NODE_ENV === 'production'
const salt = process.env.ACCESS_CODE_SALT ?? 'vm2026-local-salt'
const adminAccessCode = process.env.ADMIN_ACCESS_CODE ?? 'vm2026-admin'
const adminAccessName = process.env.ADMIN_ACCESS_NAME ?? 'Admin'

if (isProduction) {
  const missingEnvVars = [
    process.env.ACCESS_CODE_SALT ? null : 'ACCESS_CODE_SALT',
    process.env.ADMIN_ACCESS_CODE ? null : 'ADMIN_ACCESS_CODE',
  ].filter(Boolean)

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required production environment variables: ${missingEnvVars.join(', ')}`)
  }
}

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

function parseEntityId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function parseMatchId(value) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) {
    return null
  }

  return /^[A-Za-z0-9-]{3,40}$/.test(raw) ? raw : null
}

function isValidFixtureId(value) {
  if (value === undefined) {
    return true
  }

  return typeof value === 'string' && parseMatchId(value) !== null
}

function extractAdminCode(req) {
  const headerCode = req.get('x-admin-code')
  if (typeof headerCode === 'string' && headerCode.trim()) {
    return headerCode.trim()
  }

  const authorizationHeader = req.get('authorization')
  if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
    const token = authorizationHeader.slice('Bearer '.length).trim()
    if (token) {
      return token
    }
  }

  return ''
}

function requireAdminAccess(req, res, next) {
  const providedCode = extractAdminCode(req)
  if (!providedCode || providedCode !== adminAccessCode) {
    res.status(401).json({ error: 'Admin-behörighet krävs.' })
    return
  }

  next()
}

function isValidFixtureTips(tips) {
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
    const isFixtureIdValid = isValidFixtureId(tip.fixtureId)

    const hasValidScore =
      (tip.homeScore === '' || Number.isInteger(tip.homeScore)) &&
      (tip.awayScore === '' || Number.isInteger(tip.awayScore))

    return isMatchValid && isDateValid && isSignValid && isStatusValid && isFixtureIdValid && hasValidScore
  })
}

function isValidGroupPlacements(groupPlacements) {
  if (!Array.isArray(groupPlacements) || groupPlacements.length > 12) {
    return false
  }

  return groupPlacements.every((group) => {
    if (!group || typeof group !== 'object') {
      return false
    }

    if (typeof group.group !== 'string' || !Array.isArray(group.picks) || group.picks.length !== 4) {
      return false
    }

    return group.picks.every((pick) => typeof pick === 'string')
  })
}

function isValidKnockoutPredictions(knockoutPredictions) {
  if (!Array.isArray(knockoutPredictions) || knockoutPredictions.length > 8) {
    return false
  }

  const maxPicksByRound = {
    Sextondelsfinal: 32,
    'Åttondelsfinal': 16,
    Kvartsfinal: 8,
    Semifinal: 4,
    Final: 2,
  }

  return knockoutPredictions.every((round) => {
    if (!round || typeof round !== 'object') {
      return false
    }

    const title = typeof round.title === 'string' ? round.title.trim() : ''
    const maxRoundPicks = maxPicksByRound[title] ?? 32

    if (typeof round.title !== 'string' || !Array.isArray(round.picks) || round.picks.length > maxRoundPicks) {
      return false
    }

    return round.picks.every((pick) => typeof pick === 'string')
  })
}

function isValidSpecialPredictions(specialPredictions) {
  if (!specialPredictions || typeof specialPredictions !== 'object') {
    return false
  }

  return (
    typeof specialPredictions.winner === 'string' &&
    typeof specialPredictions.topScorer === 'string'
  )
}

function isValidExtraAnswers(extraAnswers) {
  if (!extraAnswers || typeof extraAnswers !== 'object' || Array.isArray(extraAnswers)) {
    return false
  }

  return Object.entries(extraAnswers).every(([questionId, answer]) => {
    const parsedQuestionId = Number(questionId)
    return Number.isInteger(parsedQuestionId) && parsedQuestionId > 0 && typeof answer === 'string'
  })
}

function normalizeAdminQuestionPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const questionText = typeof payload.questionText === 'string' ? payload.questionText.trim() : ''
  const category = typeof payload.category === 'string' ? payload.category.trim() : ''
  const options = Array.isArray(payload.options)
    ? payload.options
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : []
  const correctAnswer = typeof payload.correctAnswer === 'string' ? payload.correctAnswer.trim() : ''
  const points = Number(payload.points)
  const lockTime = typeof payload.lockTime === 'string' ? payload.lockTime.trim() : ''
  const status = typeof payload.status === 'string' ? payload.status.trim() : ''

  const allowedCategories = ['Gruppspelsfrågor', 'Slutspelsfrågor', '33-33-33 frågor']
  const allowedStatuses = ['draft', 'published']

  if (!questionText) {
    return null
  }

  if (!allowedCategories.includes(category)) {
    return null
  }

  if (options.length < 2) {
    return null
  }

  if (correctAnswer && !options.includes(correctAnswer)) {
    return null
  }

  if (!Number.isInteger(points) || points < 0 || points > 100) {
    return null
  }

  if (!lockTime || Number.isNaN(Date.parse(lockTime))) {
    return null
  }

  if (!allowedStatuses.includes(status)) {
    return null
  }

  return {
    questionText,
    category,
    options,
    correctAnswer,
    points,
    lockTime,
    status,
  }
}

function normalizeNullableScore(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 99) {
    return Number.NaN
  }

  return parsed
}

function normalizeMatchResultPayload(payload, matchId) {
  if (!payload || typeof payload !== 'object' || !matchId) {
    return null
  }

  const stage = typeof payload.stage === 'string' ? payload.stage.trim() : ''
  const round = typeof payload.round === 'string' ? payload.round.trim() : ''
  const groupCodeRaw = typeof payload.groupCode === 'string' ? payload.groupCode.trim().toUpperCase() : ''
  const homeTeam = typeof payload.homeTeam === 'string' ? payload.homeTeam.trim() : ''
  const awayTeam = typeof payload.awayTeam === 'string' ? payload.awayTeam.trim() : ''
  const kickoffAt = typeof payload.kickoffAt === 'string' ? payload.kickoffAt.trim() : ''
  const resultStatus = typeof payload.resultStatus === 'string' ? payload.resultStatus.trim() : ''
  const settledAtRaw = typeof payload.settledAt === 'string' ? payload.settledAt.trim() : ''
  const homeScore = normalizeNullableScore(payload.homeScore)
  const awayScore = normalizeNullableScore(payload.awayScore)

  const allowedStages = ['group', 'knockout']
  const allowedStatuses = ['planned', 'live', 'completed']

  if (!allowedStages.includes(stage)) {
    return null
  }

  if (!homeTeam || !awayTeam || homeTeam === awayTeam) {
    return null
  }

  if (!kickoffAt || Number.isNaN(Date.parse(kickoffAt))) {
    return null
  }

  if (!allowedStatuses.includes(resultStatus)) {
    return null
  }

  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    return null
  }

  if ((homeScore === null) !== (awayScore === null)) {
    return null
  }

  if (resultStatus === 'completed' && (homeScore === null || awayScore === null)) {
    return null
  }

  if (resultStatus === 'planned' && (homeScore !== null || awayScore !== null)) {
    return null
  }

  if (stage === 'group') {
    if (!/^[A-L]$/.test(groupCodeRaw)) {
      return null
    }

    if (round) {
      return null
    }
  }

  if (stage === 'knockout' && !round) {
    return null
  }

  if (stage === 'knockout' && groupCodeRaw) {
    return null
  }

  if (settledAtRaw && Number.isNaN(Date.parse(settledAtRaw))) {
    return null
  }

  return {
    matchId,
    stage,
    round: round || null,
    groupCode: groupCodeRaw || null,
    homeTeam,
    awayTeam,
    kickoffAt,
    homeScore,
    awayScore,
    resultStatus,
    settledAt: settledAtRaw || null,
  }
}

function normalizeSpecialResultsPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  return {
    winner: typeof payload.winner === 'string' ? payload.winner.trim() : '',
    topScorer: typeof payload.topScorer === 'string' ? payload.topScorer.trim() : '',
  }
}

function normalizeTipsPayload(tips) {
  if (Array.isArray(tips)) {
    if (!isValidFixtureTips(tips)) {
      return null
    }

    return {
      fixtureTips: tips,
      groupPlacements: [],
      knockoutPredictions: [],
      specialPredictions: {
        winner: '',
        topScorer: '',
      },
      extraAnswers: {},
    }
  }

  if (!tips || typeof tips !== 'object') {
    return null
  }

  const fixtureTips = tips.fixtureTips
  const groupPlacements = tips.groupPlacements
  const knockoutPredictions = Array.isArray(tips.knockoutPredictions) ? tips.knockoutPredictions : []
  const specialPredictions = tips.specialPredictions
  const extraAnswers = tips.extraAnswers ?? {}

  if (!isValidFixtureTips(fixtureTips)) {
    return null
  }

  if (!isValidGroupPlacements(groupPlacements)) {
    return null
  }

  if (!isValidKnockoutPredictions(knockoutPredictions)) {
    return null
  }

  if (!isValidSpecialPredictions(specialPredictions)) {
    return null
  }

  if (!isValidExtraAnswers(extraAnswers)) {
    return null
  }

  return {
    fixtureTips,
    groupPlacements,
    knockoutPredictions,
    specialPredictions,
    extraAnswers,
  }
}

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:4173', 'http://localhost:5173']

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error(`CORS: origin '${origin}' not allowed`))
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-admin-code', 'Authorization'],
  })
)

app.use(express.json({ limit: '1mb' }))

const isTest = process.env.NODE_ENV === 'test'

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'För många inloggningsförsök. Försök igen om en stund.' },
})

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

app.use('/api/admin', requireAdminAccess)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
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

app.get('/api/special-results', async (_req, res) => {
  try {
    const results = await getSpecialResults()
    res.json(results)
  } catch (error) {
    console.error('Special results read error:', error)
    res.status(500).json({ error: 'Kunde inte hämta specialresultat.' })
  }
})

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

app.get('/api/admin/special-results', async (_req, res) => {
  try {
    const results = await getSpecialResults()
    res.json(results)
  } catch (error) {
    console.error('Admin special results read error:', error)
    res.status(500).json({ error: 'Kunde inte hämta specialresultat.' })
  }
})

app.put('/api/admin/special-results', async (req, res) => {
  const payload = normalizeSpecialResultsPayload(req.body)
  if (!payload) {
    res.status(400).json({ error: 'Ogiltigt specialresultat-format.' })
    return
  }

  try {
    const savedResults = await upsertSpecialResults(payload)
    res.json(savedResults)
  } catch (error) {
    console.error('Admin special results upsert error:', error)
    res.status(500).json({ error: 'Kunde inte spara specialresultat.' })
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

app.get('/api/questions/published', async (_req, res) => {
  try {
    const questions = await listPublishedAdminQuestions()
    res.json({ questions })
  } catch (error) {
    console.error('Published questions read error:', error)
    res.status(500).json({ error: 'Kunde inte hämta publicerade frågor.' })
  }
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
