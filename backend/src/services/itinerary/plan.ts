import { randomBytes } from 'node:crypto'

import type { Hospital } from '../../store/memory.js'
import { amapDrivingRoute, amapGeocode } from '../travel/amap.js'

export type BudgetLevel = 'low' | 'mid' | 'high'

export type ItineraryPlanInput = {
  departureAddress: string
  hospital: Hospital
  city: string
  budgetLevel: BudgetLevel
  departureDate: string
  returnDate: string
}

export async function planItinerary(input: ItineraryPlanInput) {
  const route = await planRoute(input.departureAddress, input.hospital)
  const nights = estimateNights(input.departureDate, input.returnDate)

  const accommodation = mockHotels(input.city, input.budgetLevel, nights)
  const dining = mockFoods(input.city, input.budgetLevel)

  return {
    route,
    accommodation,
    dining,
    cost_estimate: {
      transport: estimateTransportCost(input.budgetLevel, route.distance_km),
      accommodation: accommodation.reduce((sum, h) => sum + h.price_per_night, 0),
      dining: dining.reduce((sum, d) => sum + d.avg_price, 0)
    }
  }
}

async function planRoute(departureAddress: string, hospital: Hospital) {
  const mode = (process.env.ROUTE_MODE ?? 'auto').toLowerCase()
  if (mode === 'mock') {
    return { mode: 'mock', distance_km: 12.3, duration_min: 35 }
  }

  if (process.env.AMAP_KEY) {
    const origin = await amapGeocode(departureAddress)
    return amapDrivingRoute(origin, hospital.coordinates)
  }

  return { mode: 'mock', distance_km: 12.3, duration_min: 35 }
}

function estimateNights(departureDate: string, returnDate: string) {
  const start = new Date(departureDate).getTime()
  const end = new Date(returnDate).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1
  const days = Math.ceil((end - start) / (24 * 3600 * 1000))
  return Math.max(1, days)
}

function estimateTransportCost(budget: BudgetLevel, distanceKm: number) {
  const base = Math.max(5, distanceKm) * 2
  if (budget === 'low') return Math.round(base * 0.9)
  if (budget === 'high') return Math.round(base * 1.3)
  return Math.round(base)
}

function mockHotels(city: string, budget: BudgetLevel, nights: number) {
  const price = budget === 'low' ? 180 : budget === 'mid' ? 380 : 780
  const seed = randomBytes(4).readUInt32BE(0)
  return Array.from({ length: 3 }).map((_, i) => ({
    id: `hotel_${seed}_${i}`,
    name: `${city}·便捷酒店${i + 1}`,
    price_per_night: price,
    nights
  }))
}

function mockFoods(city: string, budget: BudgetLevel) {
  const avg = budget === 'low' ? 25 : budget === 'mid' ? 55 : 120
  const seed = randomBytes(4).readUInt32BE(0)
  return Array.from({ length: 5 }).map((_, i) => ({
    id: `food_${seed}_${i}`,
    name: `${city}·清淡餐饮${i + 1}`,
    avg_price: avg,
    tags: ['清淡', '易消化']
  }))
}

