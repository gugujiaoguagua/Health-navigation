import { randomBytes } from 'node:crypto'

import { Router } from 'express'
import { z } from 'zod'

import { requireAuth } from '../middleware/auth.js'
import { requireLocationConsent } from '../middleware/consent.js'
import { getStore } from '../store/memory.js'
import { loadHospitalsFromFile } from '../services/hospitals/load.js'
import { planItinerary } from '../services/itinerary/plan.js'

export const itinerariesRouter = Router()

let hospitalsLoaded = false
async function ensureHospitalsLoaded() {
  if (hospitalsLoaded) return
  const hospitals = await loadHospitalsFromFile()
  const store = getStore()
  for (const h of hospitals) {
    store.hospitalsById.set(h.id, h)
  }
  hospitalsLoaded = true
}

const planSchema = z.object({
  hospital_id: z.string().min(1),
  departure_address: z.string().min(2).max(200),
  budget_level: z.enum(['low', 'mid', 'high']),
  departure_date: z.string().min(8).max(32),
  return_date: z.string().min(8).max(32),
  city: z.string().min(1).max(64)
})

itinerariesRouter.post('/plan', requireAuth, requireLocationConsent, async (req, res) => {
  await ensureHospitalsLoaded()
  const parsed = planSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'INVALID_REQUEST', details: parsed.error.flatten() })
    return
  }

  const store = getStore()
  const hospital = store.hospitalsById.get(parsed.data.hospital_id)
  if (!hospital) {
    res.status(404).json({ ok: false, error: 'HOSPITAL_NOT_FOUND' })
    return
  }

  const plan = await planItinerary({
    departureAddress: parsed.data.departure_address,
    hospital,
    city: parsed.data.city,
    budgetLevel: parsed.data.budget_level,
    departureDate: parsed.data.departure_date,
    returnDate: parsed.data.return_date
  })

  const itineraryId = randomBytes(12).toString('hex')
  store.itinerariesById.set(itineraryId, {
    id: itineraryId,
    userId: req.userId!,
    hospitalId: hospital.id,
    departureAddress: parsed.data.departure_address,
    budgetLevel: parsed.data.budget_level,
    departureDate: parsed.data.departure_date,
    returnDate: parsed.data.return_date,
    createdAt: new Date().toISOString(),
    plan
  })

  res.json({ ok: true, itinerary_id: itineraryId, plan })
})

itinerariesRouter.get('/:id', requireAuth, (req, res) => {
  const it = getStore().itinerariesById.get(req.params.id)
  if (!it || it.userId !== req.userId) {
    res.status(404).json({ ok: false, error: 'NOT_FOUND' })
    return
  }
  const itinerary_snake = {
    itinerary_id: it.id,
    user_id: it.userId,
    hospital_id: it.hospitalId,
    departure_address: it.departureAddress,
    budget_level: it.budgetLevel,
    departure_date: it.departureDate,
    return_date: it.returnDate,
    created_at: it.createdAt
  }

  res.json({ ok: true, itinerary: { ...it, ...itinerary_snake } })
})
