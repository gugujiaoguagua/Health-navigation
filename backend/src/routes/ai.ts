import { Router } from 'express'
import { z } from 'zod'

import { requireAuth } from '../middleware/auth.js'
import { requireSensitiveConsent } from '../middleware/consent.js'
import { analyzeSymptoms } from '../services/ai/analyzeSymptoms.js'
import { transcribeWithOpenAI } from '../services/ai/transcribe.js'

export const aiRouter = Router()

const analyzeSchema = z.object({
  symptom_text: z.string().trim().min(2).max(2000),
  context: z
    .object({
      age: z.number().int().min(0).max(130).optional(),
      sex: z.enum(['male', 'female', 'other']).optional(),
      location_city: z.string().trim().min(1).max(64).optional()
    })
    .optional()
})

aiRouter.post('/analyze', requireAuth, requireSensitiveConsent, async (req, res) => {
  const parsed = analyzeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'INVALID_REQUEST', details: parsed.error.flatten() })
    return
  }

  try {
    const result = await analyzeSymptoms(parsed.data)
    res.json({ ok: true, ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error'
    res.status(502).json({ ok: false, error: 'AI_UPSTREAM_ERROR', message })
  }
})

const transcribeSchema = z.object({
  audio_base64: z.string().trim().min(32).max(8_000_000),
  mime: z.string().trim().min(3).max(64).optional(),
  language: z.string().trim().min(2).max(16).optional()
})

aiRouter.post('/transcribe', requireAuth, requireSensitiveConsent, async (req, res) => {
  const parsed = transcribeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'INVALID_REQUEST', details: parsed.error.flatten() })
    return
  }

  try {
    const result = await transcribeWithOpenAI({
      audioBase64: parsed.data.audio_base64,
      mime: parsed.data.mime,
      language: parsed.data.language
    })
    res.json({ ok: true, text: result.text, model: result.model })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error'
    res.status(502).json({ ok: false, error: 'AI_UPSTREAM_ERROR', message })
  }
})
