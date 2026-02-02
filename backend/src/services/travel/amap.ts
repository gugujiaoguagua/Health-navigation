import { z } from 'zod'

const geoSchema = z.object({
  geocodes: z
    .array(
      z.object({
        location: z.string()
      })
    )
    .min(1)
})

export async function amapGeocode(address: string) {
  const key = process.env.AMAP_KEY
  if (!key) {
    throw new Error('missing AMAP_KEY')
  }

  const url = new URL('https://restapi.amap.com/v3/geocode/geo')
  url.searchParams.set('key', key)
  url.searchParams.set('address', address)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`amap geocode status ${res.status}`)
  const json = await res.json()
  const parsed = geoSchema.safeParse(json)
  if (!parsed.success) throw new Error('amap geocode invalid response')

  const [lngStr, latStr] = parsed.data.geocodes[0].location.split(',')
  const lng = Number(lngStr)
  const lat = Number(latStr)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) throw new Error('amap geocode invalid coords')
  return { lat, lng }
}

const drivingSchema = z.object({
  route: z.object({
    paths: z
      .array(
        z.object({
          distance: z.string(),
          duration: z.string()
        })
      )
      .min(1)
  })
})

export async function amapDrivingRoute(origin: { lat: number; lng: number }, dest: { lat: number; lng: number }) {
  const key = process.env.AMAP_KEY
  if (!key) {
    throw new Error('missing AMAP_KEY')
  }

  const url = new URL('https://restapi.amap.com/v3/direction/driving')
  url.searchParams.set('key', key)
  url.searchParams.set('origin', `${origin.lng},${origin.lat}`)
  url.searchParams.set('destination', `${dest.lng},${dest.lat}`)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`amap route status ${res.status}`)
  const json = await res.json()
  const parsed = drivingSchema.safeParse(json)
  if (!parsed.success) throw new Error('amap route invalid response')

  const path0 = parsed.data.route.paths[0]
  const distanceKm = Number(path0.distance) / 1000
  const durationMin = Number(path0.duration) / 60
  return {
    mode: 'driving',
    distance_km: Number(distanceKm.toFixed(2)),
    duration_min: Math.round(durationMin)
  }
}

