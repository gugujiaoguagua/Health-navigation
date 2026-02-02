import type { Hospital } from '../../store/memory.js'

export function searchHospitals(
  hospitals: Hospital[],
  query: {
    city?: string
    department?: string
    q?: string
    lat?: number
    lng?: number
  }
) {
  const q = (query.q ?? '').trim().toLowerCase()
  const dep = (query.department ?? '').trim()
  const city = (query.city ?? '').trim()

  let filtered = hospitals

  if (city) {
    filtered = filtered.filter((h) => h.city === city)
  }

  if (dep) {
    filtered = filtered.filter((h) => h.departments.includes(dep))
  }

  if (q) {
    filtered = filtered.filter((h) => {
      const hay = `${h.name} ${h.address} ${h.departments.join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }

  if (typeof query.lat === 'number' && typeof query.lng === 'number') {
    filtered = filtered
      .map((h) => ({
        hospital: h,
        distance_km: haversineKm(query.lat!, query.lng!, h.coordinates.lat, h.coordinates.lng)
      }))
      .sort((a, b) => a.distance_km - b.distance_km)
      .map((x) => ({ ...x.hospital, distance_km: Number(x.distance_km.toFixed(2)) }) as Hospital & {
        distance_km: number
      })
    return filtered
  }

  return filtered
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

