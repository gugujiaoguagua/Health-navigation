export type ApiCode =
  | 'OK'
  | 'INVALID_ARGUMENT'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INTERNAL'

export type ApiBase = {
  code: ApiCode | string
  message: string
  requestId: string
  traceId: string
  ts: string
}

export type ApiOk<T> = ApiBase & { ok: true } & T

export type ApiFail =
  | (ApiBase & {
      ok: false
      error: string
      details?: unknown
      errorType?: string
    })

export type PageCursor = {
  type: 'cursor'
  nextCursor: string | null
  hasMore: boolean
}

export type PageOffset = {
  type: 'offset'
  page: number
  pageSize: number
  total: number
}

export type EvidenceSource = {
  name: string
  providerId: string
  license?: 'public' | 'commercial' | 'unknown'
}

export type EvidenceRef = {
  id?: string
  url?: string | null
}

export type Evidence = {
  type: 'POI' | 'PUBLIC_INFO' | 'INTERNAL'
  source: EvidenceSource
  ref?: EvidenceRef
  fetchedAt: string
  fields: string[]
}

export type RecommendationMeta = {
  recommendationId: string
  algoVersion: string
  promptVersion?: string
  dataVersion: {
    poiProvider: string
    publicInfoSnapshot: string
  }
}
