import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native'

import { apiFetch } from '../../api/client'
import { useAppUI } from '../../state/AppUIContext'
import type { DepartmentsResult, Hospital } from '../../types/api'
import type { TabKey } from '../../ui/components/BottomTabs'
import { AiComposerPill } from '../../ui/components/AiComposerPill'
import { Text } from '../../ui/components/Text'
import { createSpeechToText } from '../../ui/hooks/useSpeechToText'
import { theme } from '../../ui/theme'

export function AssistantTab({ onJumpTab }: { onJumpTab: (tab: TabKey) => void }) {
  const { width } = useWindowDimensions()
  const isWide = Platform.OS === 'web' && width >= 920

  const {
    state,
    setSymptomText,
    setAnalysis,
    setDepartments,
    setRecommended,
    newChat,
    setActiveChat,
    appendChatMessage
  } = useAppUI()

  const [mode, setMode] = useState<'home' | 'chat'>(() => (state.activeChatId ? 'chat' : 'home'))
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyQuery, setHistoryQuery] = useState('')

  const enter = useRef(new Animated.Value(mode === 'chat' ? 1 : 0)).current

  const sttRef = useRef<Awaited<ReturnType<typeof createSpeechToText>> | null>(null)
  const micTimerRef = useRef<any>(null)
  const [micState, setMicState] = useState({ isRecording: false, isTranscribing: false, seconds: 0 })
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)

  const activeSession = useMemo(() => {
    if (!state.activeChatId) return null
    return state.chatSessions.find((s) => s.id === state.activeChatId) ?? null
  }, [state.activeChatId, state.chatSessions])

  const sessionsFiltered = useMemo(() => {
    const q = historyQuery.trim().toLowerCase()
    const list = [...state.chatSessions].sort((a, b) => b.updatedAt - a.updatedAt)
    if (!q) return list
    return list.filter((s) => s.title.toLowerCase().includes(q) || s.messages.some((m) => m.text.toLowerCase().includes(q)))
  }, [historyQuery, state.chatSessions])

  useEffect(() => {
    ;(async () => {
      try {
        sttRef.current = await createSpeechToText()
      } catch {
        sttRef.current = null
      }
    })()

    return () => {
      if (micTimerRef.current) {
        clearInterval(micTimerRef.current)
        micTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // 进入聊天模式时确保有一个会话
    if (mode !== 'chat') return
    if (state.activeChatId && activeSession) return
    const id = newChat()
    setActiveChat(id)
  }, [activeSession, mode, newChat, setActiveChat, state.activeChatId])

  useEffect(() => {
    // draft 与全局 symptomText 保持一致，便于跨页面复用
    setDraft(state.symptomText)
  }, [state.symptomText])

  function openChat() {
    if (!state.activeChatId) {
      const id = newChat()
      setActiveChat(id)
    }

    setMode('chat')
    setHistoryOpen(false)

    enter.setValue(0)
    Animated.timing(enter, { toValue: 1, duration: 220, useNativeDriver: true }).start()
  }

  async function submit(symptomText: string) {
    if (!activeSession) return
    const text = symptomText.trim()
    if (text.length < 2) return

    if (!state.city.trim()) {
      Alert.alert('请先选择城市', '请到「医院」页设置所在城市')
      return
    }

    setLoading(true)
    try {
      const analysis = await apiFetch<{ ok: true } & DepartmentsResult>('/v1/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({ symptom_text: text, context: { location_city: state.city } })
      })

      const departments = analysis.departments.map((d) => d.name).slice(0, 3)
      const hospitals = await apiFetch<{ ok: true; data: Hospital[]; total: number }>('/v1/hospitals/recommend', {
        method: 'POST',
        body: JSON.stringify({ departments, city: state.city })
      })

      setAnalysis(analysis)
      setDepartments(departments)
      setRecommended(hospitals.data)

      if (!hospitals.data.length) {
        appendChatMessage(activeSession.id, { role: 'assistant', text: '暂时没有匹配医院，你可以去「医院」页切换城市再试。' })
        return
      }

      appendChatMessage(activeSession.id, { role: 'assistant', text: '我已生成推荐结果，已为你打开「医院」页。' })
      onJumpTab('hospitals')
    } catch (e: any) {
      const msg = e?.error ?? e?.message ?? '未知错误'
      appendChatMessage(activeSession.id, { role: 'assistant', text: `分析失败：${msg}` })
      Alert.alert('分析失败', msg)
    } finally {
      setLoading(false)
    }
  }

  const hasTextToSend = draft.trim().length >= 2
  const canSend = hasTextToSend && !loading

  async function send() {
    if (!canSend) return

    const text = draft.trim()

    const sessionId = state.activeChatId ?? newChat()
    if (!state.activeChatId) setActiveChat(sessionId)

    setDraft('')
    setSymptomText(text)

    appendChatMessage(sessionId, { role: 'user', text })
    appendChatMessage(sessionId, { role: 'assistant', text: '收到，我来帮你分析并推荐就医方向…' })

    await submit(text)
  }

  async function micStart() {
    const stt = sttRef.current
    if (!stt) {
      Alert.alert('无法使用麦克风', '当前环境不支持录音/语音识别')
      return
    }
    if (micState.isTranscribing || micState.isRecording) return

    try {
      setMicState({ isRecording: true, isTranscribing: false, seconds: 0 })
      await stt.start()

      if (micTimerRef.current) clearInterval(micTimerRef.current)
      micTimerRef.current = setInterval(() => {
        setMicState((s) => (s.isRecording ? { ...s, seconds: s.seconds + 1 } : s))
      }, 1000)
    } catch (e: any) {
      setMicState({ isRecording: false, isTranscribing: false, seconds: 0 })
      Alert.alert('无法开始录音', e?.message ?? e?.error ?? '未知错误')
    }
  }

  async function micStop() {
    const stt = sttRef.current
    if (!stt) return

    if (micTimerRef.current) {
      clearInterval(micTimerRef.current)
      micTimerRef.current = null
    }

    if (!micState.isRecording) return

    try {
      setMicState((s) => ({ ...s, isRecording: false, isTranscribing: true }))
      const text = await stt.stop()
      setMicState({ isRecording: false, isTranscribing: false, seconds: 0 })
      if (text && text.trim()) {
        setDraft(text)
        setSymptomText(text)
      }
    } catch (e: any) {
      setMicState({ isRecording: false, isTranscribing: false, seconds: 0 })
      Alert.alert('语音识别失败', e?.error ?? e?.message ?? '未知错误')
    }
  }

  const micHint = micState.isTranscribing
    ? '正在识别语音…'
    : micState.isRecording
      ? `录音中… ${String(Math.floor(micState.seconds / 60)).padStart(2, '0')}:${String(micState.seconds % 60).padStart(2, '0')}`
      : ''

  const chatOpacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })
  const chatTranslateY = enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
      {mode === 'home' ? (
        <View style={{ flex: 1, padding: theme.space[4] }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.space[3] }}>
            <Text variant="title">健康导航</Text>

            <Pressable onPress={openChat}>
              <AiComposerPill
                value={state.symptomText}
                onChangeText={setSymptomText}
                placeholder="点我开始对话…"
                disabled={!state.city.trim()}
                onMicPress={openChat}
              />
            </Pressable>

            {state.analysis ? (
              <View
                style={{
                  width: '100%',
                  maxWidth: 560,
                  borderRadius: theme.radius.xl,
                  padding: theme.space[4],
                  backgroundColor: 'rgba(15,118,110,0.06)'
                }}
              >
                <View style={{ gap: theme.space[2] }}>
                  <Text variant="h2">就医方向</Text>
                  <Text variant="muted">推荐科室：{state.departments.join(' / ') || '—'}</Text>
                  {state.analysis.emergency_warning ? (
                    <Text style={{ color: theme.color.destructive, fontWeight: '700' }}>存在急症信号：建议优先急诊就医</Text>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: chatOpacity, transform: [{ translateY: chatTranslateY }] }}>
          {/* 顶部操作区（不提供返回键） */}
          <View style={{ paddingHorizontal: theme.space[4], paddingTop: theme.space[3], paddingBottom: theme.space[2] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="title">AI助手</Text>


              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {/* 新建对话 icon */}
                <Pressable
                  accessibilityLabel="新建对话"
                  onPress={() => {
                    const id = newChat()
                    setActiveChat(id)
                    setHistoryOpen(false)
                    setHistoryQuery('')
                  }}
                  style={({ pressed }) => [
                    {
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'transparent'
                    },
                    pressed ? { opacity: 0.75 } : null
                  ]}
                >
                  <Text
                    style={{
                      fontSize: Math.round(theme.font.h2 * 1.32),
                      lineHeight: Math.round(theme.font.h2 * 1.32),
                      fontWeight: '800',
                      color: theme.color.text
                    }}
                  >
                    ＋
                  </Text>
                </Pressable>

                {/* 历史对话 icon */}
                <Pressable
                  accessibilityLabel="历史对话"
                  onPress={() => {
                    if (isWide) {
                      // 宽屏默认常驻历史；这里提供一个手动开关
                      setHistoryOpen((v) => !v)
                      return
                    }
                    setHistoryOpen((v) => !v)
                  }}
                  style={({ pressed }) => [
                    {
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'transparent'
                    },
                    pressed ? { opacity: 0.75 } : null
                  ]}
                >
                  <Text
                    style={{
                      fontSize: Math.round(theme.font.h2 * 1.2),
                      lineHeight: Math.round(theme.font.h2 * 1.2),
                      fontWeight: '800',
                      color: historyOpen ? theme.color.primary : theme.color.mutedForeground
                    }}
                  >
                    ⟲
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={{ flex: 1, flexDirection: isWide ? 'row' : 'column' }}>
            {/* 左侧：历史（宽屏常驻；窄屏可展开） */}
            {(isWide || historyOpen) && (
              <View
                style={{
                  width: isWide ? 280 : '100%',
                  borderRightWidth: isWide ? 1 : 0,
                  borderRightColor: theme.color.border,
                  borderBottomWidth: !isWide ? 1 : 0,
                  borderBottomColor: theme.color.border,
                  paddingHorizontal: theme.space[4],
                  paddingBottom: theme.space[3]
                }}
              >
                <View style={{ paddingTop: theme.space[2], gap: theme.space[2] }}>
                  <TextInput
                    value={historyQuery}
                    onChangeText={setHistoryQuery}
                    placeholder="搜索历史对话…"
                    placeholderTextColor={theme.color.mutedForeground}
                    style={{
                      height: 40,
                      borderRadius: theme.radius.full,
                      paddingHorizontal: theme.space[3],
                      borderWidth: 1,
                      borderColor: theme.color.border,
                      backgroundColor: 'rgba(255,255,255,0.55)',
                      color: theme.color.text
                    }}
                  />

                  <ScrollView style={{ maxHeight: isWide ? undefined : 220 }} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
                    {sessionsFiltered.map((s) => {
                      const active = s.id === state.activeChatId
                      return (
                        <Pressable
                          key={s.id}
                          onPress={() => {
                            setActiveChat(s.id)
                            if (!isWide) setHistoryOpen(false)
                          }}
                          style={({ pressed }) => [
                            {
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              borderRadius: theme.radius.xl,
                              borderWidth: 1,
                              borderColor: active ? theme.color.primary : theme.color.border,
                              backgroundColor: active ? 'rgba(15,118,110,0.08)' : 'rgba(255,255,255,0.35)'
                            },
                            pressed ? { opacity: 0.85 } : null
                          ]}
                        >
                          <Text style={{ fontWeight: active ? '700' : '600' }}>{s.title || '对话'}</Text>
                          <Text variant="caption">{new Date(s.updatedAt).toLocaleString()}</Text>
                        </Pressable>
                      )
                    })}

                    {!sessionsFiltered.length ? <Text variant="caption">暂无历史对话</Text> : null}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* 右侧：对话内容 + 输入 */}
            <View style={{ flex: 1, paddingHorizontal: theme.space[4], paddingBottom: theme.space[3] }}>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingBottom: 12 }}>
                {(activeSession?.messages ?? []).map((m) => {
                  const isUser = m.role === 'user'
                  const maxW: any = isWide ? 320 : '92%'
                  // AI：白色；用户：浅绿色
                  const bg = isUser ? '#CFF7D5' : '#ffffff'
                  const fg = '#111827'

                  return (
                    <Pressable
                      key={m.id}
                      style={(state) => {
                        const hovered = Boolean((state as any).hovered)
                        const pressed = state.pressed
                        const scale = pressed ? 0.9 : Platform.OS === 'web' && hovered ? 0.97 : 1
                        return {
                          alignSelf: isUser ? 'flex-end' : 'flex-start',
                          maxWidth: maxW,
                          backgroundColor: bg,
                          borderRadius: 40,
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          transform: [{ scale }]
                        }
                      }}
                    >
                      <Text style={{ color: fg, fontWeight: '600' }}>{m.text}</Text>
                    </Pressable>
                  )
                })}
              </ScrollView>

              {micHint ? <Text variant="caption">{micHint}</Text> : null}

              {/* Uiverse searchbar 风格输入框：右侧内嵌麦克风 + 条件显示发送 */}
              <Pressable
                style={(state) => [
                  {
                    height: 44,
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#dfe1e5',
                    borderRadius: 24,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: 16,
                    paddingRight: 8
                  },
                  Platform.OS === 'web' && Boolean((state as any).hovered)
                    ? {
                        borderColor: 'rgba(223,225,229,0)',
                        shadowColor: 'rgba(32,33,36,0.28)',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 1,
                        shadowRadius: 6
                      }
                    : null,
                  state.pressed ? { opacity: 0.96 } : null
                ]}
              >

                {/* 中间输入 */}
                <View style={{ flex: 1, height: 44, justifyContent: 'center' }}>
                  <TextInput
                    value={draft}
                    onChangeText={(t) => {
                      setDraft(t)
                      setSymptomText(t)
                    }}
                    placeholder="描述你的症状/疾病…"
                    placeholderTextColor={theme.color.mutedForeground}
                    returnKeyType="send"
                    blurOnSubmit={false}
                    onSubmitEditing={() => {
                      if (canSend) void send()
                    }}
                    style={{
                      height: 34,
                      padding: 0,
                      margin: 0,
                      backgroundColor: 'transparent',
                      borderWidth: 0,
                      color: 'rgba(0, 0, 0, 0.87)',
                      fontSize: 16
                    }}
                  />
                </View>

                {/* 右侧：麦克风（常驻） + 发送（有内容时出现） */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable
                    onPressIn={micStart}
                    onPressOut={micStop}
                    disabled={micState.isTranscribing}
                    style={({ pressed }) => [
                      {
                        height: 44,
                        paddingHorizontal: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 18,
                        backgroundColor: 'transparent'
                      },
                      micState.isRecording ? { backgroundColor: 'rgba(212,24,61,0.10)' } : null,
                      pressed ? { opacity: 0.85 } : null,
                      micState.isTranscribing ? { opacity: 0.6 } : null
                    ]}
                  >
                    <Text style={{ color: micState.isRecording ? theme.color.destructive : '#9aa0a6', fontWeight: '800' }}>
                      {micState.isTranscribing ? '…' : '🎙'}
                    </Text>
                  </Pressable>

                  {hasTextToSend ? (
                    <Pressable
                      onPress={() => void send()}
                      disabled={!canSend}
                      style={({ pressed }) => [
                        {
                          height: 32,
                          paddingHorizontal: 12,
                          borderRadius: 16,
                          backgroundColor: theme.color.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: 4
                        },
                        pressed ? { opacity: 0.9 } : null,
                        !canSend ? { opacity: 0.6 } : null
                      ]}
                    >
                      <Text style={{ color: theme.color.primaryForeground, fontWeight: '700' }}>{loading ? '…' : '发送'}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  )
}
