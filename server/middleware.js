/**
 * Middleware setup for Express app
 */

import crypto from 'node:crypto'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'

const isTest = process.env.NODE_ENV === 'test'
const salt = process.env.ACCESS_CODE_SALT ?? 'vm2026-local-salt'
const adminAccessCode = process.env.ADMIN_ACCESS_CODE ?? 'vm2026-admin'
const adminAccessName = process.env.ADMIN_ACCESS_NAME ?? 'Admin'

const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:4173', 'http://localhost:5173', 'http://192.168.1.182:4173']

function hashAccessCode(code) {
    return crypto.scryptSync(code, salt, 64).toString('hex')
}

function normalizeName(name) {
    return name.trim().replace(/\s+/g, ' ')
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

function setupMiddleware(app) {
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

    const authRateLimit = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20,
        skip: () => isTest,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'För många inloggningsförsök. Försök igen om en stund.' },
    })

    return { authRateLimit, requireAdminAccess }
}

export {
    hashAccessCode,
    normalizeName,
    extractAdminCode,
    requireAdminAccess,
    setupMiddleware,
    adminAccessCode,
    adminAccessName,
}
