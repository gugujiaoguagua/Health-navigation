import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { requestContext } from './middleware/requestContext.js'
import { aiRouter } from './routes/ai.js'
import { authRouter } from './routes/auth.js'
import { checklistsRouter } from './routes/checklists.js'
import { consentsRouter } from './routes/consents.js'
import { healthRouter } from './routes/health.js'
import { hospitalsRouter } from './routes/hospitals.js'
import { itinerariesRouter } from './routes/itineraries.js'
import { routesRouter } from './routes/routes.js'
import { openapiRouter } from './routes/openapi.js'

export function createApp() {
  const app = express()

  // NOTE: Expo Web 预览/IDE 内嵌预览通常运行在 iframe 中；同时地图 Web 端会嵌入 OSM iframe。
  // 默认 helmet 的 CSP / X-Frame-Options / COEP 可能导致“刷新后白屏”。MVP 阶段先放开，后续再按域名收紧。
  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      crossOriginEmbedderPolicy: false
    })
  )
  app.use(cors())
  // STT audio (base64) can be larger; keep it bounded and short-recording in client.
  app.use(express.json({ limit: '10mb' }))

  // Request-scoped ids + unified response enrichment
  app.use(requestContext)

  app.use(morgan('combined'))
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({ ok: false, error: 'RATE_LIMITED', message: 'Too many requests' })
      }
    })
  )

  app.use('/v1/health', healthRouter)
  app.use('/v1/auth', authRouter)
  app.use('/v1/consents', consentsRouter)
  app.use('/v1/ai', aiRouter)
  app.use('/v1/hospitals', hospitalsRouter)
  app.use('/v1/routes', routesRouter)
  app.use('/v1/itineraries', itinerariesRouter)
  app.use('/v1/checklists', checklistsRouter)
  app.use('/v1', openapiRouter)

  // Serve web build (Expo export) from ../public when present.
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const publicDir = path.resolve(__dirname, '../public')
  const indexHtml = path.join(publicDir, 'index.html')

  if (existsSync(publicDir) && existsSync(indexHtml)) {
    app.use(express.static(publicDir, { index: false }))

    // SPA fallback: let API routes continue to 404, everything else serves index.html
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/v1')) return next()
      res.sendFile(indexHtml)
    })
  }

  // Unified error exit
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // Keep it minimal for MVP; traceId is attached by requestContext
    process.stderr.write(`[unhandled_error] ${String((err as any)?.message ?? err)}\n`)
    res.status(500).json({ ok: false, error: 'INTERNAL', message: 'Internal server error' })
  })

  return app
}
