import { Router } from 'express'
import { z } from 'zod'

import { requireAuth } from '../middleware/auth.js'
import { getStore } from '../store/memory.js'

export const consentsRouter = Router()

consentsRouter.get('/', requireAuth, (req, res) => {
  const consent = getStore().getOrInitConsent(req.userId!)

  // preferred snake_case; keep camelCase for compatibility.
  const consent_snake = {
    user_id: consent.userId,
    privacy_policy_version: consent.privacyPolicyVersion,
    privacy_accepted_at: consent.privacyAcceptedAt,
    sensitive_accepted: consent.sensitiveAccepted,
    sensitive_accepted_at: consent.sensitiveAcceptedAt ?? null,
    location_accepted: consent.locationAccepted,
    location_accepted_at: consent.locationAcceptedAt ?? null
  }

  res.json({ ok: true, consent: { ...consent, ...consent_snake } })
})

const updateSchema = z.object({
  // preferred snake_case
  privacy_policy_version: z.string().trim().min(1).max(16).optional(),
  accept_privacy: z.boolean().optional(),
  accept_sensitive: z.boolean().optional(),
  accept_location: z.boolean().optional(),

  // compat camelCase
  privacyPolicyVersion: z.string().trim().min(1).max(16).optional(),
  acceptPrivacy: z.boolean().optional(),
  acceptSensitive: z.boolean().optional(),
  acceptLocation: z.boolean().optional()
})

consentsRouter.post('/', requireAuth, (req, res) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'INVALID_REQUEST', details: parsed.error.flatten() })
    return
  }

  const store = getStore()
  const consent = store.getOrInitConsent(req.userId!)
  const now = new Date().toISOString()

  const privacyPolicyVersion = parsed.data.privacy_policy_version ?? parsed.data.privacyPolicyVersion
  const acceptPrivacy = parsed.data.accept_privacy ?? parsed.data.acceptPrivacy
  const acceptSensitive = parsed.data.accept_sensitive ?? parsed.data.acceptSensitive
  const acceptLocation = parsed.data.accept_location ?? parsed.data.acceptLocation

  if (privacyPolicyVersion) {
    consent.privacyPolicyVersion = privacyPolicyVersion
  }

  if (acceptPrivacy) {
    consent.privacyAcceptedAt = now
  }

  if (acceptSensitive === true && !consent.sensitiveAccepted) {
    consent.sensitiveAccepted = true
    consent.sensitiveAcceptedAt = now
  }

  if (acceptLocation === true && !consent.locationAccepted) {
    consent.locationAccepted = true
    consent.locationAcceptedAt = now
  }

  store.consentsByUserId.set(req.userId!, consent)

  const consent_snake = {
    user_id: consent.userId,
    privacy_policy_version: consent.privacyPolicyVersion,
    privacy_accepted_at: consent.privacyAcceptedAt,
    sensitive_accepted: consent.sensitiveAccepted,
    sensitive_accepted_at: consent.sensitiveAcceptedAt ?? null,
    location_accepted: consent.locationAccepted,
    location_accepted_at: consent.locationAcceptedAt ?? null
  }

  res.json({ ok: true, consent: { ...consent, ...consent_snake } })
})

