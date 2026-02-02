import { randomInt } from 'node:crypto'

import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'

import { getStore } from '../store/memory.js'
import { signAccessToken } from '../utils/jwt.js'

export const authRouter = Router()

const sendCodeSchema = z.object({
  phone: z.string().trim().regex(/^1\d{10}$/)
})

const loginSchema = z.object({
  phone: z.string().trim().regex(/^1\d{10}$/),
  code: z.string().trim().regex(/^\d{6}$/)
})

authRouter.post(
  '/send-code',
  rateLimit({
    windowMs: 60_000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ ok: false, error: 'RATE_LIMITED', message: 'Too many requests' })
    }
  }),
  (req, res) => {
    const parsed = sendCodeSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: 'INVALID_REQUEST', details: parsed.error.flatten() })
      return
    }

    const store = getStore()
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    store.setSmsCode(parsed.data.phone, code, 5 * 60_000)

    const mode = (process.env.SMS_MODE ?? 'mock').toLowerCase()
    res.json({ ok: true, mode, expires_in_seconds: 300, mock_code: mode === 'mock' ? code : undefined })
  }
)

authRouter.post(
  '/login-with-code',
  rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ ok: false, error: 'RATE_LIMITED', message: 'Too many requests' })
    }
  }),
  (req, res) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: 'INVALID_REQUEST', details: parsed.error.flatten() })
      return
    }

    const store = getStore()
    if (!store.verifySmsCode(parsed.data.phone, parsed.data.code)) {
      res.status(401).json({ ok: false, error: 'INVALID_CODE' })
      return
    }

    store.clearSmsCode(parsed.data.phone)
    const user = store.upsertUserByPhone(parsed.data.phone)
    store.getOrInitConsent(user.id)

    const accessToken = signAccessToken(user.id)
    res.json({ ok: true, user: { id: user.id, phone: user.phone }, access_token: accessToken })
  }
)

