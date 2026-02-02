import { Platform } from 'react-native'

import { apiFetch } from '../../api/client'

type SpeechState = {
  isRecording: boolean
  isTranscribing: boolean
  lastError: string | null
}

type SpeechApi = {
  state: SpeechState
  start: () => Promise<void>
  stop: () => Promise<string | null>
}

export async function createSpeechToText(): Promise<SpeechApi> {
  if (Platform.OS === 'web') {
    return createWebSpeechToText()
  }
  return createNativeSpeechToText()
}

async function createNativeSpeechToText(): Promise<SpeechApi> {
  const { Audio } = await import('expo-av')
  const FileSystem = (await import('expo-file-system')) as any


  let recording: any | null = null
  const state: SpeechState = { isRecording: false, isTranscribing: false, lastError: null }

  async function start() {
    try {
      state.lastError = null
      const perm = await Audio.requestPermissionsAsync()
      if (!perm.granted) {
        throw new Error('麦克风权限未授权')
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false
      })

      const r = new Audio.Recording()
      await r.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await r.startAsync()
      recording = r
      state.isRecording = true
    } catch (e: any) {
      state.lastError = e?.message ?? String(e)
      state.isRecording = false
      recording = null
      throw e
    }
  }

  async function stop() {
    if (!recording) return null
    try {
      state.lastError = null
      state.isTranscribing = true
      state.isRecording = false

      await recording.stopAndUnloadAsync()
      const uri = recording.getURI?.() as string | null
      recording = null

      if (!uri) return null

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })
      const resp = await apiFetch<{ ok: true; text: string; model?: string }>('/v1/ai/transcribe', {
        method: 'POST',
        body: JSON.stringify({ audio_base64: base64, mime: 'audio/m4a', language: 'zh' })
      })
      return resp.text ?? null
    } catch (e: any) {
      state.lastError = e?.error ?? e?.message ?? String(e)
      throw e
    } finally {
      state.isTranscribing = false
    }
  }

  return { state, start, stop }
}

async function createWebSpeechToText(): Promise<SpeechApi> {
  const state: SpeechState = { isRecording: false, isTranscribing: false, lastError: null }

  const SR: any = (globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition
  if (!SR) {
    return {
      state,
      start: async () => {
        state.lastError = 'Browser speech recognition not supported'
      },
      stop: async () => null
    }
  }

  const recognition = new SR()
  recognition.lang = 'zh-CN'
  recognition.continuous = false
  recognition.interimResults = false

  let lastResult: string | null = null

  recognition.onresult = (event: any) => {
    const text = event?.results?.[0]?.[0]?.transcript
    if (typeof text === 'string') lastResult = text
  }

  recognition.onerror = (event: any) => {
    state.lastError = event?.error ?? 'speech error'
  }

  async function start() {
    state.lastError = null
    lastResult = null
    state.isRecording = true
    recognition.start()
  }

  async function stop() {
    state.isRecording = false
    state.isTranscribing = true
    try {
      recognition.stop()
      // Give the browser a tick to flush onresult
      await new Promise((r) => setTimeout(r, 250))
      return lastResult
    } finally {
      state.isTranscribing = false
    }
  }

  return { state, start, stop }
}
