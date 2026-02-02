import { Router } from 'express'
import { z } from 'zod'

import { getStore } from '../store/memory.js'
import { loadHospitalsFromFile } from '../services/hospitals/load.js'
import { searchHospitals } from '../services/hospitals/search.js'

export const hospitalsRouter = Router()

let loaded = false

async function ensureLoaded() {
  if (loaded) return
  const hospitals = await loadHospitalsFromFile()
  const store = getStore()
  for (const h of hospitals) {
    store.hospitalsById.set(h.id, h)
  }
  loaded = true
}

hospitalsRouter.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=600')
  await ensureLoaded()
  const schema = z.object({
    city: z.string().optional(),
    department: z.string().optional(),
    q: z.string().optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    page: z.coerce.number().int().min(1).optional(),

    // preferred snake_case
    page_size: z.coerce.number().int().min(1).max(100).optional(),

    // compat camelCase
    pageSize: z.coerce.number().int().min(1).max(100).optional()
  })

  const parsed = schema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'INVALID_REQUEST', details: parsed.error.flatten() })
    return
  }

  const store = getStore()
  const hospitals = Array.from(store.hospitalsById.values())
  const results = searchHospitals(hospitals, parsed.data)

  const page = parsed.data.page
  const pageSize = parsed.data.page_size ?? parsed.data.pageSize
  if (typeof page === 'number' && typeof pageSize === 'number') {
    const start = (page - 1) * pageSize
    const sliced = results.slice(start, start + pageSize)
    res.json({
      ok: true,
      data: sliced,
      total: results.length,
      page: { type: 'offset', page, pageSize, page_size: pageSize, total: results.length }
    })
    return
  }

  res.json({ ok: true, data: results, total: results.length })
})

hospitalsRouter.get('/:id', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600')
  await ensureLoaded()
  const h = getStore().hospitalsById.get(req.params.id)
  if (!h) {
    res.status(404).json({ ok: false, error: 'NOT_FOUND' })
    return
  }
  res.json({ ok: true, hospital: h })
})

const recommendSchema = z.object({
  departments: z.array(z.string().min(1)).min(1).max(5),
  city: z.string().min(1).max(64),
  lat: z.number().optional(),
  lng: z.number().optional()
})

hospitalsRouter.post('/recommend', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  await ensureLoaded()
  const parsed = recommendSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'INVALID_REQUEST', details: parsed.error.flatten() })
    return
  }

  const store = getStore()
  const hospitals = Array.from(store.hospitalsById.values()).filter((h) => h.city === parsed.data.city)
  const ranked = hospitals
    .map((h) => ({
      hospital: h,
      score: parsed.data.departments.reduce((acc, d) => acc + (h.departments.includes(d) ? 1 : 0), 0)
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((x) => x.hospital)

  const withDistance =
    typeof parsed.data.lat === 'number' && typeof parsed.data.lng === 'number'
      ? searchHospitals(ranked, { lat: parsed.data.lat, lng: parsed.data.lng })
      : ranked

  const fetchedAt = new Date().toISOString()
  const meta = {
    recommendationId: `rec_${fetchedAt.replace(/[-:.TZ]/g, '')}`,
    algoVersion: 'ranker@0.1.0',
    promptVersion: 'triage@0.1.0',
    dataVersion: {
      poiProvider: 'sample_file@0.1.0',
      publicInfoSnapshot: 'none'
    }
  }

  const items = withDistance.map((h, idx) => {
    const matched = parsed.data.departments.filter((d) => h.departments.includes(d))
    return {
      hospital: h,
      rank: idx + 1,
      reason: matched.map((d) => `匹配科室：${d}`),
      evidence: [
        {
          type: 'POI',
          source: { name: 'SampleData', providerId: 'sample', license: 'unknown' },
          ref: { id: h.id, url: null },
          fetchedAt,
          fields: ['name', 'address', 'location', 'departments']
        }
      ]
    }
  })

  // 兼容旧移动端：保留 data/total，同时新增 meta/items/evidence 以满足可追溯要求
  res.json({ ok: true, data: withDistance, total: withDistance.length, meta, items })
})

