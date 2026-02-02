import type { Response } from 'express'

export function ok<T extends Record<string, unknown>>(res: Response, payload: T, status = 200) {
  res.status(status).json({ ok: true, ...payload })
}

export function fail(
  res: Response,
  status: number,
  error: string,
  opts?: { message?: string; details?: unknown; code?: string; errorType?: string }
) {
  res.status(status).json({
    ok: false,
    error,
    ...(opts?.code ? { code: opts.code } : {}),
    ...(opts?.message ? { message: opts.message } : {}),
    ...(opts?.details !== undefined ? { details: opts.details } : {}),
    ...(opts?.errorType ? { errorType: opts.errorType } : {})
  })
}
