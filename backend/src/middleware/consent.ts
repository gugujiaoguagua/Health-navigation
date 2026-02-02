import type { RequestHandler } from 'express'

import { getStore } from '../store/memory.js'

export const requireSensitiveConsent: RequestHandler = (req, res, next) => {
  const userId = req.userId
  if (!userId) {
    res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
    return
  }

  const consent = getStore().consentsByUserId.get(userId)
  if (!consent?.sensitiveAccepted) {
    res.status(403).json({ ok: false, error: 'SENSITIVE_CONSENT_REQUIRED' })
    return
  }

  next()
}

export const requireLocationConsent: RequestHandler = (req, res, next) => {
  const userId = req.userId
  if (!userId) {
    res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
    return
  }

  const consent = getStore().consentsByUserId.get(userId)
  if (!consent?.locationAccepted) {
    res.status(403).json({ ok: false, error: 'LOCATION_CONSENT_REQUIRED' })
    return
  }

  next()
}

