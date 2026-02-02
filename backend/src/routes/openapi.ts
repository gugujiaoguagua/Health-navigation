import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { Router } from 'express'

import { fail } from '../api/respond.js'

export const openapiRouter = Router()

openapiRouter.get('/openapi.yaml', async (_req, res) => {
  try {
    const filePath = process.env.OPENAPI_PATH
      ? process.env.OPENAPI_PATH
      : path.resolve(process.cwd(), 'openapi.yaml')

    const content = await readFile(filePath, 'utf8')
    res.setHeader('Content-Type', 'application/yaml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=600')
    res.status(200).send(content)

  } catch (err) {
    fail(res, 404, 'NOT_FOUND', {
      message: 'openapi.yaml not found',
      details: { reason: (err as Error)?.message ?? String(err) }
    })
  }
})
