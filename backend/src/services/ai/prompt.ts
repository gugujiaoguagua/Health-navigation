import type { AnalyzeInput } from './analyzeSymptoms.js'

export function buildSymptomPrompt(input: AnalyzeInput) {
  const ctx = input.context ?? {}
  const contextParts: string[] = []
  if (typeof ctx.age === 'number') contextParts.push(`年龄：${ctx.age}`)
  if (ctx.sex) contextParts.push(`性别：${ctx.sex}`)
  if (ctx.location_city) contextParts.push(`所在城市：${ctx.location_city}`)

  const context = contextParts.length ? `\n补充信息：${contextParts.join('，')}\n` : '\n'

  return [
    '你是一位专业的医疗分诊助手。你只能给出“该去哪个科室/急诊”的建议，不能给出诊断结论或用药方案。',
    '请严格输出 JSON（不要包含代码块标记），格式如下：',
    '{"departments":[{"name":"科室名称","confidence":0.0,"reason":"推荐理由"}],"summary":"简要总结","emergency_warning":false}',
    context,
    `用户症状描述：${input.symptom_text}`
  ].join('\n')
}

