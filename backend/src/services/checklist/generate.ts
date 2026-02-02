import fs from 'node:fs/promises'
import path from 'node:path'

import { z } from 'zod'

const templateSchema = z.object({
  version: z.string(),
  categories: z.record(z.array(z.string().min(1)).min(1))
})

export type ChecklistGenerateInput = {
  days: number
  hasAccommodation: boolean
  emergencyWarning?: boolean
}

export async function generateChecklist(input: ChecklistGenerateInput) {
  const tpl = await loadTemplate()
  const base = structuredClone(tpl.categories) as Record<string, string[]>

  if (input.days >= 2) {
    base['衣物'] = [...new Set([...(base['衣物'] ?? []), '换洗衣物', '外套'])]
  }

  if (input.hasAccommodation) {
    base['住宿'] = [...new Set([...(base['住宿'] ?? []), '洗漱用品', '充电器', '拖鞋'])]
  }

  if (input.emergencyWarning) {
    base['紧急'] = [...new Set([...(base['紧急'] ?? []), '紧急联系人电话', '既往史摘要（如有）'])]
  }

  return {
    version: tpl.version,
    categories: Object.entries(base).map(([category, items]) => ({
      category,
      items: items.map((name) => ({ name, checked: false }))
    }))
  }
}

async function loadTemplate() {
  const root = path.resolve(process.cwd(), '..')
  const file = process.env.CHECKLIST_TEMPLATE_FILE ?? path.join(root, 'data', 'checklist_templates.json')
  const raw = await fs.readFile(file, 'utf8')
  const json = JSON.parse(raw)
  const parsed = templateSchema.parse(json)
  return parsed
}

