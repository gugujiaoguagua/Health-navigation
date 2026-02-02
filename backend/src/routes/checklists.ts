import { Router } from 'express'
import { z } from 'zod'

import { requireAuth } from '../middleware/auth.js'
import { getStore } from '../store/memory.js'
import { generateChecklist } from '../services/checklist/generate.js'

export const checklistsRouter = Router()

const schema = z.object({
  itinerary_id: z.string().min(1),
  days: z.number().int().min(1).max(30)
})

checklistsRouter.post('/generate', requireAuth, async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'INVALID_REQUEST', details: parsed.error.flatten() })
    return
  }

  const it = getStore().itinerariesById.get(parsed.data.itinerary_id)
  if (!it || it.userId !== req.userId) {
    res.status(404).json({ ok: false, error: 'ITINERARY_NOT_FOUND' })
    return
  }

  const plan: any = it.plan ?? {}
  const hasAccommodation = Array.isArray(plan.accommodation) ? plan.accommodation.length > 0 : !!plan.accommodation
  const checklist = await generateChecklist({
    days: parsed.data.days,
    hasAccommodation,
    emergencyWarning: plan?.emergency_warning
  })

  res.json({ ok: true, checklist })
})

