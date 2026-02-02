const keywords = [
  '胸痛',
  '呼吸困难',
  '意识丧失',
  '昏迷',
  '大出血',
  '抽搐',
  '中风',
  '口角歪斜',
  '一侧无力',
  '剧烈头痛'
]

export function emergencyHeuristic(text: string) {
  const normalized = text.replace(/\s+/g, '')
  return keywords.some((k) => normalized.includes(k))
}

