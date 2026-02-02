import { Platform } from 'react-native'
import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'

import type { ApiError } from '../types/api'

const TOKEN_KEY = 'access_token'
let tokenCache: string | null | undefined = undefined

export function getApiBaseUrl() {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL
  if (explicit && explicit.trim()) return explicit.trim()

  const port = Number(process.env.EXPO_PUBLIC_API_PORT ?? 3000)
  if (Platform.OS === 'web') {
    const host = globalThis.location?.hostname ?? 'localhost'
    return `http://${host}:${port}`
  }

  const hostUri = (Constants.expoConfig as any)?.hostUri ?? (Constants as any)?.manifest?.debuggerHost
  const host = extractHostname(hostUri) ?? process.env.EXPO_PUBLIC_API_HOST
  if (host && host.trim()) return `http://${host.trim()}:${port}`
  return `http://localhost:${port}`
}

function extractHostname(hostUri: unknown) {
  if (typeof hostUri !== 'string') return null
  const beforeSlash = hostUri.split('/')[0]
  const hostname = beforeSlash.split(':')[0]
  return hostname && hostname.trim() ? hostname.trim() : null
}

export async function getToken() {
  if (tokenCache !== undefined) return tokenCache
  if (Platform.OS === 'web') {
    tokenCache = globalThis.localStorage?.getItem(TOKEN_KEY) ?? null
    return tokenCache
  }
  tokenCache = (await SecureStore.getItemAsync(TOKEN_KEY)) ?? null
  return tokenCache
}

export async function setToken(token: string | null) {
  tokenCache = token ?? null
  if (!token) {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(TOKEN_KEY)
      return
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    return
  }
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(TOKEN_KEY, token)
    return
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl()
  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`
  const token = await getToken()

  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const clientVersion = (Constants.expoConfig as any)?.version ?? (Constants as any)?.manifest?.version

  const timeoutMs = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? 10000)
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null

  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      signal: controller?.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
        'X-Client-Platform': Platform.OS,
        ...(clientVersion ? { 'X-Client-Version': String(clientVersion) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {})
      }
    })
  } catch (e: any) {
    const isAbort = e?.name === 'AbortError'
    const err: ApiError = {
      ok: false,
      error: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: isAbort ? `Request timeout after ${timeoutMs}ms` : e?.message ?? 'Network request failed',
      details: { url }
    }
    throw err
  } finally {
    if (timeout) clearTimeout(timeout)
  }

  const text = await res.text()
  let json: unknown = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { ok: false, error: 'INVALID_RESPONSE', message: 'Non-JSON response from server', details: { text } }
  }

  if (!res.ok) {
    throw json as ApiError
  }

  return json as T
}
