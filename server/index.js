import fs from 'node:fs'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase, closeDatabase } from './db.js'
import { setupMiddleware, requireAdminAccess } from './middleware.js'
import { createAuthRoutes } from './auth-routes.js'
import { createAdminRoutes } from './admin-routes.js'
import { createPublicRoutes } from './public-routes.js'
import { createTipsRoutes } from './tips-routes.js'

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
    throw new Error(`Missing required production environment variables: ${missingEnvVars.join(', ')}`)
  }
}

// Setup middleware (CORS, JSON parser, auth rate limiter)
const { authRateLimit } = setupMiddleware(app)

// Register route handlers
createAuthRoutes(app, authRateLimit)
createPublicRoutes(app, globalDeadline)
createTipsRoutes(app)

// Admin routes require authentication
app.use('/api/admin', requireAdminAccess)
createAdminRoutes(app)

// Database transfer endpoints (admin-protected, under /api/admin prefix)
const dbPath = path.resolve(process.cwd(), 'data', 'vm2026.db')

app.post('/api/admin/db-upload',
  express.raw({ type: 'application/octet-stream', limit: '50mb' }),
  (req, res) => {
    try {
      fs.writeFileSync(dbPath, req.body)
      res.json({ ok: true, bytes: req.body.length, message: 'Database uploaded. Restart the service to apply.' })
    } catch (error) {
      console.error('DB upload error:', error)
      res.status(500).json({ error: 'Failed to write database file.' })
    }
  }
)

app.get('/api/admin/db-download', (_req, res) => {
  res.download(dbPath, 'vm2026.db')
})

// In production, serve the Vite build output
if (isProduction) {
  const distPath = path.resolve(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  // SPA fallback: serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}


// Database initialization and server lifecycle
let dbReady = false
let dbError = null

initDatabase()
  .then(() => {
    dbReady = true
    console.log('Database initialized successfully.')
  })
  .catch((error) => {
    dbError = error
    console.error('Failed to initialize database:', error)
  })

// Health endpoint reflects DB state
app.get('/api/startup-status', (_req, res) => {
  res.json({ dbReady, dbError: dbError ? String(dbError) : null })
})

// Start listening immediately (so healthcheck passes and we can diagnose)
const server = app.listen(port, () => {
  console.log(`VM2026 API listening on http://localhost:${port}`)
})

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`)
  server.close(async () => {
    try {
      await closeDatabase()
      console.log('Database closed. Exiting.')
    } catch (err) {
      console.error('Error closing database:', err)
    }
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
