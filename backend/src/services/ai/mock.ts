import type { AnalyzeInput } from './analyzeSymptoms.js'

export function mockAnalyze(input: AnalyzeInput, emergency: boolean) {
  const text = input.symptom_text
  const departments = [
    { name: '内科', confidence: 0.55, reason: '症状描述信息有限，优先建议先由内科评估与分诊。' },
    { name: '全科医学科', confidence: 0.5, reason: '可进行初步评估并根据检查结果转诊至专科。' },
    { name: emergency ? '急诊科' : '专科门诊', confidence: emergency ? 0.9 : 0.3, reason: emergency ? '存在潜在急危重症信号，建议立即就医。' : '若症状加重或持续不缓解建议就医。' }
  ]

  return {
    model: 'mock',
    departments,
    emergency_warning: emergency,
    summary: text.slice(0, 120)
  }
}

