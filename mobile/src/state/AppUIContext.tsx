import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

import type { Checklist, DepartmentsResult, Hospital, ItineraryPlan } from '../types/api'

export type AppLanguage = 'zh' | 'en' | 'ru'

export type HealthRecordItem = {
  id: string
  kind: 'text' | 'file'
  addedAt: number
  scanStatus: 'pending' | 'done'
  text?: string
  fileName?: string
  mime?: string
  size?: number
  extractedText?: string
}

export type HealthInsight = {
  conditions: string[]
  recipes: { title: string; reason: string }[]
  updatedAt: number
}

export type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
  ts: number
}

export type ChatSession = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

export type SavedItinerary = {
  itineraryId: string
  days: number
  savedAt: number
  isPinned?: boolean
  hospitalId?: string
  hospitalName?: string
  plan?: ItineraryPlan
  checklist?: Checklist
  selectedAccommodationId?: string
}

export type AppQueryState = {
  city: string
  symptomText: string
  language: AppLanguage
  analysis: DepartmentsResult | null
  departments: string[]
  recommended: Hospital[]

  chatSessions: ChatSession[]
  activeChatId: string | null

  savedItineraries: SavedItinerary[]
  healthRecords: HealthRecordItem[]
  healthInsight: HealthInsight | null
}

type Ctx = {
  state: AppQueryState
  setCity: (v: string) => void
  setSymptomText: (v: string) => void
  setLanguage: (v: AppLanguage) => void
  setAnalysis: (a: DepartmentsResult | null) => void
  setDepartments: (d: string[]) => void
  setRecommended: (h: Hospital[]) => void
  addHealthText: (text: string) => Promise<void>
  addHealthFiles: (files: { name: string; type: string; size: number }[]) => Promise<void>
  removeHealthRecord: (id: string) => Promise<void>

  newChat: () => string
  setActiveChat: (id: string) => void
  appendChatMessage: (sessionId: string, msg: { role: 'assistant' | 'user'; text: string }) => void
  saveItinerary: (v: {
    itineraryId: string
    days: number
    hospitalId?: string
    hospitalName?: string
    plan?: ItineraryPlan
    checklist?: Checklist
    selectedAccommodationId?: string
  }) => Promise<void>
  removeItinerary: (itineraryId: string) => Promise<void>
  togglePinItinerary: (itineraryId: string) => Promise<void>
  reset: () => void
}

const AppUIContext = createContext<Ctx | null>(null)

function createSession(): ChatSession {
  const now = Date.now()
  const id = `c_${now}`
  return {
    id,
    title: '新对话',
    createdAt: now,
    updatedAt: now,
    messages: [{ id: `m_${now}`, role: 'assistant', text: '怎么帮助你？', ts: now }]
  }
}

const initialState: AppQueryState = {
  city: '上海',
  symptomText: '',
  language: 'zh',
  analysis: null,
  departments: [],
  recommended: [],

  chatSessions: [],
  activeChatId: null,

  savedItineraries: [],
  healthRecords: [],
  healthInsight: null
}

const SAVED_ITINERARIES_KEY = 'hn_saved_itineraries_v1'
const LANGUAGE_KEY = 'hn_language_v1'
const HEALTH_RECORDS_KEY = 'hn_health_records_v1'

async function readSavedItineraries(): Promise<SavedItinerary[]> {
  try {
    if (Platform.OS === 'web') {
      const raw = globalThis.localStorage?.getItem(SAVED_ITINERARIES_KEY) ?? null
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed
        .filter((x) => x && typeof x === 'object')
        .map((x: any) => ({
          itineraryId: String(x.itineraryId ?? ''),
          days: Number(x.days ?? 0),
          savedAt: Number(x.savedAt ?? 0),
          isPinned: !!x.isPinned,
          hospitalId: x.hospitalId ? String(x.hospitalId) : undefined,
          hospitalName: x.hospitalName ? String(x.hospitalName) : undefined,
          plan: x.plan && typeof x.plan === 'object' ? (x.plan as ItineraryPlan) : undefined,
          checklist: x.checklist && typeof x.checklist === 'object' ? (x.checklist as Checklist) : undefined,
          selectedAccommodationId: x.selectedAccommodationId ? String(x.selectedAccommodationId) : undefined
        }))
        .filter((x) => x.itineraryId && Number.isFinite(x.days) && x.days > 0 && Number.isFinite(x.savedAt) && x.savedAt > 0)
    }

    const raw = (await SecureStore.getItemAsync(SAVED_ITINERARIES_KEY)) ?? null
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x) => x && typeof x === 'object')
      .map((x: any) => ({
        itineraryId: String(x.itineraryId ?? ''),
      days: Number(x.days ?? 0),
      savedAt: Number(x.savedAt ?? 0),
      isPinned: !!x.isPinned,
      hospitalId: x.hospitalId ? String(x.hospitalId) : undefined,
        hospitalName: x.hospitalName ? String(x.hospitalName) : undefined,
        plan: x.plan && typeof x.plan === 'object' ? (x.plan as ItineraryPlan) : undefined,
        checklist: x.checklist && typeof x.checklist === 'object' ? (x.checklist as Checklist) : undefined,
        selectedAccommodationId: x.selectedAccommodationId ? String(x.selectedAccommodationId) : undefined
      }))
      .filter((x) => x.itineraryId && Number.isFinite(x.days) && x.days > 0 && Number.isFinite(x.savedAt) && x.savedAt > 0)
  } catch {
    return []
  }
}

async function writeSavedItineraries(list: SavedItinerary[]) {
  const raw = JSON.stringify(list)
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(SAVED_ITINERARIES_KEY, raw)
    return
  }
  await SecureStore.setItemAsync(SAVED_ITINERARIES_KEY, raw)
}

async function readLanguage(): Promise<AppLanguage> {
  try {
    const raw =
      Platform.OS === 'web'
        ? (globalThis.localStorage?.getItem(LANGUAGE_KEY) ?? null)
        : ((await SecureStore.getItemAsync(LANGUAGE_KEY)) ?? null)
    if (raw === 'zh' || raw === 'en' || raw === 'ru') return raw
    return 'zh'
  } catch {
    return 'zh'
  }
}

async function writeLanguage(lang: AppLanguage) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(LANGUAGE_KEY, lang)
    return
  }
  await SecureStore.setItemAsync(LANGUAGE_KEY, lang)
}

async function readHealthRecords(): Promise<HealthRecordItem[]> {
  try {
    const raw =
      Platform.OS === 'web'
        ? (globalThis.localStorage?.getItem(HEALTH_RECORDS_KEY) ?? null)
        : ((await SecureStore.getItemAsync(HEALTH_RECORDS_KEY)) ?? null)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x) => x && typeof x === 'object')
      .map((x: any): HealthRecordItem => {
        const kind: HealthRecordItem['kind'] = x.kind === 'file' ? 'file' : 'text'
        const scanStatus: HealthRecordItem['scanStatus'] = x.scanStatus === 'done' ? 'done' : 'pending'
        return {
          id: String(x.id ?? ''),
          kind,
          addedAt: Number(x.addedAt ?? 0),
          scanStatus,
          text: typeof x.text === 'string' ? x.text : undefined,
          fileName: typeof x.fileName === 'string' ? x.fileName : undefined,
          mime: typeof x.mime === 'string' ? x.mime : undefined,
          size: Number.isFinite(Number(x.size)) ? Number(x.size) : undefined,
          extractedText: typeof x.extractedText === 'string' ? x.extractedText : undefined
        }
      })
      .filter((x) => x.id && Number.isFinite(x.addedAt) && x.addedAt > 0)
  } catch {
    return []
  }
}

async function writeHealthRecords(list: HealthRecordItem[]) {
  const raw = JSON.stringify(list)
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(HEALTH_RECORDS_KEY, raw)
    return
  }
  await SecureStore.setItemAsync(HEALTH_RECORDS_KEY, raw)
}

function buildHealthInsight(records: HealthRecordItem[]): HealthInsight | null {
  const text = records
    .map((r) => (r.kind === 'text' ? r.text ?? '' : r.extractedText ?? ''))
    .join('\n')
    .trim()
  if (!text) return null

  const lower = text.toLowerCase()
  const conditions: string[] = []

  const add = (c: string) => {
    if (!conditions.includes(c)) conditions.push(c)
  }

  if (text.includes('糖尿病') || lower.includes('diabetes')) add('血糖管理')
  if (text.includes('高血压') || lower.includes('hypertension')) add('血压管理')
  if (text.includes('高血脂') || lower.includes('hyperlipidem')) add('血脂管理')
  if (text.includes('痛风') || lower.includes('gout') || text.includes('尿酸')) add('尿酸管理')
  if (text.includes('脂肪肝')) add('肝脏养护')
  if (text.includes('胃') || lower.includes('gastr')) add('胃部调养')

  if (!conditions.length) add('均衡饮食')

  const recipes: { title: string; reason: string }[] = []
  const push = (title: string, reason: string) => recipes.push({ title, reason })

  if (conditions.includes('血糖管理')) {
    push('番茄鸡蛋豆腐汤', '低糖、优质蛋白，适合控糖')
    push('燕麦坚果酸奶杯', '低GI，延缓血糖波动')
  }
  if (conditions.includes('血压管理')) {
    push('清蒸鲈鱼配西兰花', '低盐高钾，心血管友好')
    push('芹菜胡萝卜炒木耳', '膳食纤维丰富，清淡少盐')
  }
  if (conditions.includes('尿酸管理')) {
    push('冬瓜虾仁汤（少量虾）', '清淡补水，避免高嘌呤主食材')
    push('凉拌黄瓜豆芽', '低嘌呤、低油盐')
  }
  if (conditions.includes('胃部调养')) {
    push('小米南瓜粥', '温和易消化')
    push('山药瘦肉粥', '养胃、蛋白补充')
  }

  if (!recipes.length) {
    push('三色蔬菜鸡胸沙拉', '高纤维、低油脂')
    push('菌菇豆腐煲', '蛋白与膳食纤维兼顾')
  }

  return { conditions, recipes, updatedAt: Date.now() }
}

export function AppUIProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppQueryState>(initialState)

  useEffect(() => {
    void (async () => {
      const [savedItineraries, language, healthRecords] = await Promise.all([
        readSavedItineraries(),
        readLanguage(),
        readHealthRecords()
      ])
      setState((s) => ({
        ...s,
        savedItineraries,
        language,
        healthRecords,
        healthInsight: buildHealthInsight(healthRecords)
      }))
    })()
  }, [])

  const value = useMemo<Ctx>(() => {
    return {
      state,
      setCity: (v) => setState((s) => ({ ...s, city: v })),
      setSymptomText: (v) => setState((s) => ({ ...s, symptomText: v })),
      setLanguage: (v) =>
        setState((s) => {
          if (s.language === v) return s
          void writeLanguage(v)
          return { ...s, language: v }
        }),
      setAnalysis: (a) => setState((s) => ({ ...s, analysis: a })),
      setDepartments: (d) => setState((s) => ({ ...s, departments: d })),
      setRecommended: (h) => setState((s) => ({ ...s, recommended: h })),
      addHealthText: async (text) => {
        const trimmed = String(text ?? '').trim()
        if (!trimmed) return
        const now = Date.now()
        const id = `hr_${now}`
        setState((prev) => {
          const nextItem: HealthRecordItem = {
            id,
            kind: 'text',
            addedAt: now,
            scanStatus: 'done',
            text: trimmed
          }
          const next = [nextItem, ...prev.healthRecords]
          void writeHealthRecords(next)
          return { ...prev, healthRecords: next, healthInsight: buildHealthInsight(next) }
        })
      },
      addHealthFiles: async (files) => {
        const list = Array.isArray(files) ? files : []
        const now = Date.now()
        const items: HealthRecordItem[] = list
          .filter((f) => f && typeof f === 'object')
          .map((f, idx) => ({
            id: `hrf_${now}_${idx}`,
            kind: 'file' as const,
            addedAt: now + idx,
            scanStatus: 'pending' as const,
            fileName: String((f as any).name ?? ''),
            mime: String((f as any).type ?? ''),
            size: Number((f as any).size ?? 0) || 0
          }))
          .filter((x) => x.fileName)
        if (!items.length) return

        setState((prev) => {
          const next = [...items, ...prev.healthRecords]
          void writeHealthRecords(next)
          return { ...prev, healthRecords: next }
        })

        setTimeout(() => {
          setState((prev) => {
            const next: HealthRecordItem[] = prev.healthRecords.map((r): HealthRecordItem => {
              const hit = items.find((x) => x.id === r.id)
              if (!hit) return r
              return {
                ...r,
                scanStatus: 'done' as const,
                extractedText: hit.fileName ? `已解析文件：${hit.fileName}` : r.extractedText
              }
            })
            void writeHealthRecords(next)
            return { ...prev, healthRecords: next, healthInsight: buildHealthInsight(next) }
          })
        }, 1200)
      },
      removeHealthRecord: async (id) => {
        const trimmed = String(id ?? '').trim()
        if (!trimmed) return
        setState((prev) => {
          const next = prev.healthRecords.filter((r) => r.id !== trimmed)
          void writeHealthRecords(next)
          return { ...prev, healthRecords: next, healthInsight: buildHealthInsight(next) }
        })
      },

      newChat: () => {
        const s = createSession()
        setState((prev) => ({
          ...prev,
          activeChatId: s.id,
          chatSessions: [s, ...prev.chatSessions]
        }))
        return s.id
      },
      setActiveChat: (id) => setState((s) => ({ ...s, activeChatId: id })),
      appendChatMessage: (sessionId, msg) => {
        const now = Date.now()
        setState((prev) => {
          const sessions = prev.chatSessions.map((s) => {
            if (s.id !== sessionId) return s
            const next: ChatSession = {
              ...s,
              updatedAt: now,
              title:
                s.title === '新对话' && msg.role === 'user'
                  ? msg.text.slice(0, 12)
                  : s.title,
              messages: [...s.messages, { id: `m_${now}`, role: msg.role, text: msg.text, ts: now }]
            }
            return next
          })
          return { ...prev, chatSessions: sessions }
        })
      },

      saveItinerary: async ({ itineraryId, days, hospitalId, hospitalName, plan, checklist, selectedAccommodationId }) => {
        const trimmed = String(itineraryId ?? '').trim()
        if (!trimmed || !Number.isFinite(days) || days <= 0) return
        const hid = hospitalId ? String(hospitalId).trim() : ''
        const hname = hospitalName ? String(hospitalName).trim() : ''
        const selectedId = selectedAccommodationId ? String(selectedAccommodationId).trim() : ''

        setState((prev) => {
          const now = Date.now()
          const existing = prev.savedItineraries.find((x) => x.itineraryId === trimmed) ?? null
          const nextItem: SavedItinerary = existing
            ? {
                ...existing,
                days,
                savedAt: now,
                hospitalId: hid || existing.hospitalId,
                hospitalName: hname || existing.hospitalName,
                plan: plan ?? existing.plan,
                checklist: checklist ?? existing.checklist,
                selectedAccommodationId: selectedId || existing.selectedAccommodationId
              }
            : {
                itineraryId: trimmed,
                days,
                savedAt: now,
                hospitalId: hid || undefined,
                hospitalName: hname || undefined,
                plan: plan ?? undefined,
                checklist: checklist ?? undefined,
                selectedAccommodationId: selectedId || undefined
              }
          const next = [nextItem, ...prev.savedItineraries.filter((x) => x.itineraryId !== trimmed)]
          void writeSavedItineraries(next)
          return { ...prev, savedItineraries: next }
        })
      },
      removeItinerary: async (itineraryId) => {
        const trimmed = String(itineraryId ?? '').trim()
        if (!trimmed) return
        setState((prev) => {
          const next = prev.savedItineraries.filter((x) => x.itineraryId !== trimmed)
          void writeSavedItineraries(next)
          return { ...prev, savedItineraries: next }
        })
      },
      togglePinItinerary: async (itineraryId) => {
        const trimmed = String(itineraryId ?? '').trim()
        if (!trimmed) return
        setState((prev) => {
          const next = prev.savedItineraries.map((it) =>
            it.itineraryId === trimmed ? { ...it, isPinned: !it.isPinned } : it
          )
          void writeSavedItineraries(next)
          return { ...prev, savedItineraries: next }
        })
      },

      reset: () => setState((prev) => ({ ...initialState, savedItineraries: prev.savedItineraries }))
    }
  }, [state])

  return <AppUIContext.Provider value={value}>{children}</AppUIContext.Provider>
}

export function useAppUI() {
  const ctx = useContext(AppUIContext)
  if (!ctx) throw new Error('useAppUI must be used within AppUIProvider')
  return ctx
}
