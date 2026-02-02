export type ApiMeta = {
  code: string
  message: string

  // preferred snake_case
  request_id: string
  trace_id: string

  // compat camelCase
  requestId: string
  traceId: string

  ts: string
}

export type ApiOk<T> = T & { ok: true } & Partial<ApiMeta>

export type ApiError = {
  ok: false
  error: string
  message?: string
  code?: string

  // preferred snake_case
  request_id?: string
  trace_id?: string

  // compat camelCase
  requestId?: string
  traceId?: string

  ts?: string
  details?: unknown
}

export type LoginResponse = ApiOk<{ user: { id: string; phone: string }; access_token: string }>

export type Consent = {
  // preferred snake_case
  user_id: string
  privacy_policy_version: string
  privacy_accepted_at: string
  sensitive_accepted: boolean
  sensitive_accepted_at?: string | null
  location_accepted: boolean
  location_accepted_at?: string | null

  // compat camelCase
  userId: string
  privacyPolicyVersion: string
  privacyAcceptedAt: string
  sensitiveAccepted: boolean
  sensitiveAcceptedAt?: string
  locationAccepted: boolean
  locationAcceptedAt?: string
}

export type DepartmentsResult = {
  model: string
  departments: { name: string; confidence: number; reason: string }[]
  emergency_warning?: boolean
  summary?: string
}

export type Hospital = {
  id: string
  name: string
  level?: string
  city: string
  address: string
  departments: string[]
  coordinates: { lat: number; lng: number }
  distance_km?: number
}

export type ItineraryPlan = {
  route: { mode: string; distance_km: number; duration_min: number }
  accommodation: { id: string; name: string; price_per_night: number; nights: number }[]
  dining: { id: string; name: string; avg_price: number; tags: string[] }[]
  cost_estimate: { transport: number; accommodation: number; dining: number }
}

export type Checklist = {
  version: string
  categories: { category: string; items: { name: string; checked: boolean }[] }[]
}

