export function parseAiDepartmentJson(input: { content: string }) {
  const raw = input.content.trim()

  const first = raw.indexOf('{')
  const last = raw.lastIndexOf('}')
  if (first === -1 || last === -1 || last <= first) {
    return {}
  }

  const candidate = raw.slice(first, last + 1)
  try {
    return JSON.parse(candidate)
  } catch {
    return {}
  }
}

