import fs from 'node:fs'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { setupMiddleware, requireAdminAccess } from './middleware.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4174)
const isProduction = process.env.NODE_ENV === 'production'
const globalDeadline = process.env.GLOBAL_DEADLINE ?? '2026-06-09T22:00:00'

if (isProduction) {
  const missingEnvVars = [
    process.env.ACCESS_CODE_SALT ? null : 'ACCESS_CODE_SALT',
    process.env.ADMIN_ACCESS_CODE ? null : 'ADMIN_ACCESS_CODE',
  ].filter(Boolean)

  if (missingEnvVars.length > 0) {
    console.error(`Missing required production environment variables: ${missingEnvVars.join(', ')}`)
  }
}

// Setup middleware (CORS, JSON parser, auth rate limiter)
const { authRateLimit } = setupMiddleware(app)

// Database transfer endpoints (admin-protected, no DB dependency)
const dbPath = path.resolve(process.cwd(), 'data', 'vm2026.db')

app.use('/api/admin', requireAdminAccess)

app.post('/api/admin/db-upload',
  express.raw({ type: 'application/octet-stream', limit: '50mb' }),
  (req, res) => {
    try {
      const dir = path.dirname(dbPath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(dbPath, req.body)
      res.json({ ok: true, bytes: req.body.length, message: 'Database uploaded. Restart the service to apply.' })
    } catch (error) {
      console.error('DB upload error:', error)
      res.status(500).json({ error: 'Failed to write database file.' })
    }
  }
)

app.get('/api/admin/db-download', (_req, res) => {
  if (!fs.existsSync(dbPath)) return res.status(404).json({ error: 'No database file found.' })
  res.download(dbPath, 'vm2026.db')
})

// Startup status for diagnostics
let dbReady = false
let dbError = null

app.get('/api/startup-status', (_req, res) => {
  res.json({ dbReady, dbError: dbError ? String(dbError) : null })
})

// Dynamically import and register all DB-dependent routes
async function registerRoutes() {
  try {
    const [
      { initDatabase, closeDatabase },
      { createAuthRoutes },
      { createAdminRoutes },
      { createPublicRoutes },
      { createTipsRoutes },
    ] = await Promise.all([
      import('./db.js'),
      import('./auth-routes.js'),
      import('./admin-routes.js'),
      import('./public-routes.js'),
      import('./tips-routes.js'),
    ])

    // Register route handlers
    createAuthRoutes(app, authRateLimit)
    createPublicRoutes(app, globalDeadline)
    createTipsRoutes(app)
    createAdminRoutes(app)

    await initDatabase()
    dbReady = true
    console.log('Database initialized and routes registered successfully.')

    return closeDatabase
  } catch (error) {
    dbError = error
    console.error('Failed to initialize application:', error)
    return null
  }
}

// In production, serve the Vite build output (AFTER API routes)
if (isProduction) {
  const distPath = path.resolve(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  // SPA fallback: serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// Start listening immediately, then initialize DB+routes
const server = app.listen(port, () => {
  console.log(`VM2026 API listening on http://localhost:${port}`)
})

let closeDatabase = null
registerRoutes().then((closeFn) => { closeDatabase = closeFn })

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`)
  server.close(async () => {
    try {
      if (closeDatabase) await closeDatabase()
      console.log('Database closed. Exiting.')
    } catch (err) {
      console.error('Error closing database:', err)
    }
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
