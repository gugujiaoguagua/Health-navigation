import { callGlm, callMiniMax, callQwen, UpstreamError, type CompletionResult, type ProviderName } from './providers.js'

type CircuitState = {
  failures: number
  openedUntilMs: number
}

class ModelRouter {
  private qwen: CircuitState = { failures: 0, openedUntilMs: 0 }
  private glm: CircuitState = { failures: 0, openedUntilMs: 0 }
  private minimax: CircuitState = { failures: 0, openedUntilMs: 0 }

  private failureThreshold = Number(process.env.AI_CB_FAILURE_THRESHOLD ?? 3)
  private resetTimeoutMs = Number(process.env.AI_CB_RESET_TIMEOUT_MS ?? 300000)

  async complete(prompt: string): Promise<CompletionResult> {
    const { primary, fallback } = this.pickProviders()

    const now = Date.now()
    if (primary !== fallback && this.isOpen(primary, now) && !this.isOpen(fallback, now)) {
      return this.tryProvider(fallback, prompt)
    }

    try {
      return await this.tryProvider(primary, prompt)
    } catch (e) {
      const shouldFallback = this.shouldFallback(e)
      if (!shouldFallback || primary === fallback) throw e
      return this.tryProvider(fallback, prompt)
    }
  }

  private pickProviders(): { primary: ProviderName; fallback: ProviderName } {
    const hasKey: Record<ProviderName, boolean> = {
      qwen: Boolean(process.env.DASHSCOPE_API_KEY),
      glm: Boolean(process.env.GLM_API_KEY),
      minimax: Boolean(process.env.MINIMAX_API_KEY)
    }

    const preferred = String(process.env.AI_PRIMARY_PROVIDER ?? '').toLowerCase() as ProviderName
    const preferredFallback = String(process.env.AI_FALLBACK_PROVIDER ?? '').toLowerCase() as ProviderName

    const defaultOrder: ProviderName[] = ['qwen', 'glm', 'minimax']
    const enabled = defaultOrder.filter((p) => hasKey[p])
    const primary = hasKey[preferred] ? preferred : enabled[0] ?? 'qwen'
    const fallback = hasKey[preferredFallback]
      ? preferredFallback
      : enabled.find((p) => p !== primary) ?? primary

    return { primary, fallback }
  }

  private isOpen(name: ProviderName, now: number) {
    const s = this.state(name)
    return s.openedUntilMs > now
  }

  private state(name: ProviderName) {
    if (name === 'qwen') return this.qwen
    if (name === 'glm') return this.glm
    return this.minimax
  }

  private recordSuccess(name: ProviderName) {
    const s = this.state(name)
    s.failures = 0
    s.openedUntilMs = 0
  }

  private recordFailure(name: ProviderName) {
    const s = this.state(name)
    s.failures += 1
    if (s.failures >= this.failureThreshold) {
      s.openedUntilMs = Date.now() + this.resetTimeoutMs
    }
  }

  private shouldFallback(e: unknown) {
    if (e instanceof UpstreamError) {
      if (e.status === 429) return true
      if (typeof e.status === 'number' && e.status >= 500) return true
      if (!e.status) return true
      return false
    }
    if (e instanceof Error && e.name === 'AbortError') return true
    return true
  }

  private async tryProvider(name: ProviderName, prompt: string): Promise<CompletionResult> {
    const now = Date.now()
    if (this.isOpen(name, now)) {
      throw new UpstreamError(`${name} circuit open`, name)
    }

    try {
      const result =
        name === 'qwen' ? await callQwen(prompt) : name === 'glm' ? await callGlm(prompt) : await callMiniMax(prompt)
      this.recordSuccess(name)
      return result
    } catch (e) {
      this.recordFailure(name)
      throw e
    }
  }
}

let singleton: ModelRouter | undefined

export function getModelRouter() {
  if (!singleton) singleton = new ModelRouter()
  return singleton
}

