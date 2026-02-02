export type CompletionResult = {
  model: string
  content: string
}

export type ProviderName = 'qwen' | 'glm' | 'minimax'

export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly provider: ProviderName,
    public readonly status?: number
  ) {
    super(message)
  }
}

function timeoutSignal(ms: number) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, dispose: () => clearTimeout(id) }
}

export async function callQwen(prompt: string): Promise<CompletionResult> {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    throw new UpstreamError('missing DASHSCOPE_API_KEY', 'qwen')
  }

  // DashScope OpenAI-compatible endpoint
  const url = process.env.QWEN_BASE_URL ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
  const model = process.env.QWEN_MODEL ?? 'qwen-turbo'

  const t = timeoutSignal(Number(process.env.AI_TIMEOUT_MS ?? 20000))
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: t.signal
    })

    if (!res.ok) {
      throw new UpstreamError(`qwen upstream status ${res.status}`, 'qwen', res.status)
    }

    const data = (await res.json()) as any
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      throw new UpstreamError('qwen invalid response', 'qwen')
    }

    return { model, content }
  } finally {
    t.dispose()
  }
}

export async function callGlm(prompt: string): Promise<CompletionResult> {
  const apiKey = process.env.GLM_API_KEY
  if (!apiKey) {
    throw new UpstreamError('missing GLM_API_KEY', 'glm')
  }

  const url = process.env.GLM_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
  const model = process.env.GLM_MODEL ?? 'glm-4.7'

  const t = timeoutSignal(Number(process.env.AI_TIMEOUT_MS ?? 20000))
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: t.signal
    })

    if (!res.ok) {
      throw new UpstreamError(`glm upstream status ${res.status}`, 'glm', res.status)
    }

    const data = (await res.json()) as any
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      throw new UpstreamError('glm invalid response', 'glm')
    }

    return { model, content }
  } finally {
    t.dispose()
  }
}

export async function callMiniMax(prompt: string): Promise<CompletionResult> {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) {
    throw new UpstreamError('missing MINIMAX_API_KEY', 'minimax')
  }

  const url = process.env.MINIMAX_BASE_URL ?? 'https://api.minimax.chat/v1/text/chatcompletion_v2'
  const model = process.env.MINIMAX_MODEL ?? 'MiniMax-M2.1'

  const t = timeoutSignal(Number(process.env.AI_TIMEOUT_MS ?? 20000))
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: t.signal
    })

    if (!res.ok) {
      throw new UpstreamError(`minimax upstream status ${res.status}`, 'minimax', res.status)
    }

    const data = (await res.json()) as any
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.reply ??
      data?.output ??
      data?.result?.choices?.[0]?.message?.content

    if (typeof content !== 'string' || !content.trim()) {
      throw new UpstreamError('minimax invalid response', 'minimax')
    }

    return { model, content }
  } finally {
    t.dispose()
  }
}

