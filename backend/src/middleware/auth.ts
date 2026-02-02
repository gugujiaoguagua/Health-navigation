import type { RequestHandler } from 'express'

import { getStore } from '../store/memory.js'
import { verifyAccessToken } from '../utils/jwt.js'

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.header('authorization') ?? ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
    return
  }

  try {
    const payload = verifyAccessToken(match[1])
    const store = getStore()
    const user = store.usersById.get(payload.sub)
    if (!user) {
      res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
      return
    }
    req.userId = user.id
    next()
  } catch {
    res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
  }
}

