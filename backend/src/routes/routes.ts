import { Router } from 'express'
import { z } from 'zod'

import { requireAuth } from '../middleware/auth.js'
import { requireLocationConsent } from '../middleware/consent.js'

export const routesRouter = Router()

type RouteMode = 'drive' | 'walk'

type Coord = { lat: number; lng: number }

type RouteSummary = {
  mode: RouteMode
  distance_m: number
  duration_s: number
  coordinates: Coord[]
}

const coordSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
})

const routeRequestSchema = z.object({
  from: coordSchema,
  to: coordSchema
})

type CacheEntry = { expiresAt: number; value: RouteSummary }
const routeCache = new Map<string, CacheEntry>()

function round6(n: number) {
  return Math.round(n * 1e6) / 1e6
}

function cacheKey(mode: RouteMode, from: Coord, to: Coord) {
  // 约 0.1m 级别的量化，足够复用且不会把不同路线混在一起。
  return `${mode}:${round6(from.lat)},${round6(from.lng)}->${round6(to.lat)},${round6(to.lng)}`
}

function getOsrmBaseUrl() {
  // 可切换自建：OSRM_BASE_URL=https://osrm.your-domain.com
  const base = (process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org').trim()
  return base.replace(/\/$/, '')
}

async function fetchOsrmRoute(mode: RouteMode, from: Coord, to: Coord): Promise<RouteSummary> {
  const base = getOsrmBaseUrl()
  const profile = mode === 'walk' ? 'foot' : 'driving'

  const url = `${base}/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`

  const ac = new AbortController()
  const timeout = setTimeout(() => ac.abort(), 8000)

  try {
    const res = await fetch(url, { signal: ac.signal })
    const json = await res.json().catch(() => null)

    if (!res.ok) {
      const status = res.status
      throw Object.assign(new Error(`osrm_status_${status}`), { status })
    }

    const route0 = json?.routes?.[0]
    const coords = route0?.geometry?.coordinates
    if (!Array.isArray(coords) || !coords.length) {
      throw new Error('osrm_empty_geometry')
    }

    const coordinates: Coord[] = coords
      .filter((p: any) => Array.isArray(p) && p.length >= 2)
      .map((p: any) => ({ lat: Number(p[1]), lng: Number(p[0]) }))
      .filter((p: any) => Number.isFinite(p.lat) && Number.isFinite(p.lng))

    return {
      mode,
      distance_m: Number(route0?.distance ?? 0) || 0,
      duration_s: Number(route0?.duration ?? 0) || 0,
      coordinates
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function handleRoute(mode: RouteMode, req: any, res: any) {
  const parsed = routeRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'INVALID_REQUEST', details: parsed.error.flatten() })
    return
  }

  const { from, to } = parsed.data

  const key = cacheKey(mode, from, to)
  const now = Date.now()
  const hit = routeCache.get(key)
  if (hit && hit.expiresAt > now) {
    res.setHeader('Cache-Control', 'private, max-age=60')
    res.json({ ok: true, route: hit.value })
    return
  }

  try {
    const route = await fetchOsrmRoute(mode, from, to)
    routeCache.set(key, { expiresAt: now + 60_000, value: route })
    res.setHeader('Cache-Control', 'private, max-age=60')
    res.json({ ok: true, route })
  } catch (e: any) {
    if (String(e?.name ?? '') === 'AbortError') {
      res.status(504).json({ ok: false, error: 'ROUTE_TIMEOUT' })
      return
    }
    res.status(502).json({ ok: false, error: 'ROUTE_UPSTREAM_ERROR', details: { message: String(e?.message ?? e) } })
  }
}

routesRouter.post('/drive', requireAuth, requireLocationConsent, async (req, res) => {
  await handleRoute('drive', req, res)
})

routesRouter.post('/walk', requireAuth, requireLocationConsent, async (req, res) => {
  await handleRoute('walk', req, res)
})
