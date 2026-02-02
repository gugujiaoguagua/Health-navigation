import { randomBytes, randomUUID } from 'node:crypto'

import type { RequestHandler } from 'express'

declare global {
  namespace Express {
    interface Request {
      requestId?: string
      traceId?: string
      requestTs?: string
    }
  }
}

function genId() {
  try {
    return randomUUID()
  } catch {
    return randomBytes(16).toString('hex')
  }
}

function mapErrorToCode(error: unknown, statusCode: number): string {
  const e = typeof error === 'string' ? error : ''

  // explicit mappings based on current project conventions
  switch (e) {
    case 'INVALID_REQUEST':
      return 'INVALID_ARGUMENT'
    case 'UNAUTHORIZED':
      return 'UNAUTHENTICATED'
    case 'LOCATION_CONSENT_REQUIRED':
    case 'SENSITIVE_CONSENT_REQUIRED':
      return 'FORBIDDEN'
    case 'NOT_FOUND':
    case 'HOSPITAL_NOT_FOUND':
    case 'ITINERARY_NOT_FOUND':
      return 'NOT_FOUND'
    case 'AI_UPSTREAM_ERROR':
    case 'ROUTE_UPSTREAM_ERROR':
      return 'UPSTREAM_UNAVAILABLE'
    case 'ROUTE_TIMEOUT':
      return 'TIMEOUT'
    default:
      break
  }


  if (statusCode === 429) return 'RATE_LIMITED'
  if (statusCode === 404) return 'NOT_FOUND'
  if (statusCode === 401) return 'UNAUTHENTICATED'
  if (statusCode === 403) return 'FORBIDDEN'
  if (statusCode >= 500) return 'INTERNAL'
  if (statusCode >= 400) return 'INVALID_ARGUMENT'
  return 'OK'
}

export const requestContext: RequestHandler = (req, res, next) => {
  const incomingRequestId = req.header('x-request-id')
  const requestId = incomingRequestId && incomingRequestId.trim() ? incomingRequestId.trim() : genId()
  const traceId = genId()
  const ts = new Date().toISOString()

  req.requestId = requestId
  req.traceId = traceId
  req.requestTs = ts

  res.setHeader('X-Request-Id', requestId)
  res.setHeader('X-Trace-Id', traceId)

  const originalJson = res.json.bind(res)

  res.json = ((body: unknown) => {
    // Only enrich object responses. If a handler returns non-object, wrap it.
    const statusCode = res.statusCode

    // Preferred naming: snake_case; keep camelCase for compatibility.
    const base = {
      request_id: requestId,
      trace_id: traceId,
      ts,
      requestId,
      traceId
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return originalJson({ ok: true, code: 'OK', message: 'success', data: body, ...base })
    }

    const obj = body as Record<string, unknown>

    if (obj.request_id === undefined) obj.request_id = requestId
    if (obj.trace_id === undefined) obj.trace_id = traceId

    if (obj.requestId === undefined) obj.requestId = requestId
    if (obj.traceId === undefined) obj.traceId = traceId

    if (obj.ts === undefined) obj.ts = ts

    const ok = obj.ok
    if (obj.message === undefined) {
      obj.message = ok === true ? 'success' : typeof obj.error === 'string' ? (obj.error as string) : 'error'
    }
    if (obj.code === undefined) {
      obj.code = mapErrorToCode(obj.error, statusCode)
    }

    return originalJson(obj)
  }) as any

  next()
}
