import { z } from 'zod'

import { getModelRouter } from './modelRouter.js'
import { buildSymptomPrompt } from './prompt.js'
import { emergencyHeuristic } from './emergency.js'
import { parseAiDepartmentJson } from './parse.js'
import { mockAnalyze } from './mock.js'

const outputSchema = z.object({
  departments: z
    .array(
      z.object({
        name: z.string().min(1),
        confidence: z.number().min(0).max(1),
        reason: z.string().min(1)
      })
    )
    .min(1)
    .max(10),
  summary: z.string().min(1).max(500).optional(),
  emergency_warning: z.boolean().optional()
})

export type AnalyzeInput = {
  symptom_text: string
  context?: {
    age?: number
    sex?: 'male' | 'female' | 'other'
    location_city?: string
  }
}

export async function analyzeSymptoms(input: AnalyzeInput) {
  const emergency = emergencyHeuristic(input.symptom_text)

  const mode = (process.env.AI_MODE ?? 'auto').toLowerCase()
  if (mode === 'mock') {
    return mockAnalyze(input, emergency)
  }

  const prompt = buildSymptomPrompt(input)
  const router = getModelRouter()
  const completion = await router.complete(prompt)
  const extracted = parseAiDepartmentJson(completion)

  const validated = outputSchema.safeParse(extracted)
  if (!validated.success) {
    return mockAnalyze(input, emergency)
  }

  return {
    model: completion.model,
    departments: validated.data.departments.slice(0, 5),
    emergency_warning: validated.data.emergency_warning ?? emergency,
    summary: validated.data.summary ?? ''
  }
}

