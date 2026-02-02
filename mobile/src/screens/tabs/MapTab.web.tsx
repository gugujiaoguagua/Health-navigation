import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, SafeAreaView, TextInput, View } from 'react-native'

import { apiFetch } from '../../api/client'
import { useAppUI } from '../../state/AppUIContext'
import type { Hospital } from '../../types/api'
import { Card } from '../../ui/components/Card'
import { Text } from '../../ui/components/Text'
import { theme } from '../../ui/theme'


type Coord = { latitude: number; longitude: number }

function defaultCenter(city: string): Coord {
  if (city.includes('上海')) return { latitude: 31.2304, longitude: 121.4737 }
  if (city.includes('北京')) return { latitude: 39.9042, longitude: 116.4074 }
  if (city.includes('广州')) return { latitude: 23.1291, longitude: 113.2644 }
  if (city.includes('深圳')) return { latitude: 22.5431, longitude: 114.0579 }
  return { latitude: 31.2304, longitude: 121.4737 }
}

export function MapTab() {
  const { state } = useAppUI()

  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Hospital[]>([])
  const [focused, setFocused] = useState<Hospital | null>(null)

  const debounceRef = useRef<number | null>(null)

  const center = useMemo(() => {
    const h = focused
    if (h?.coordinates) return { latitude: h.coordinates.lat, longitude: h.coordinates.lng }
    return defaultCenter(state.city)
  }, [focused, state.city])

  const src = useMemo(() => {
    const c = center
    // 定位到具体医院时拉近一点，用户感知更明显
    const zoom = focused ? 16 : 12

    // 经验公式：lonSpan≈360/2^zoom, latSpan≈170/2^zoom（粗略；足够用于 embed bbox）
    const lonSpan = 360 / Math.pow(2, zoom)
    const latSpan = 170 / Math.pow(2, zoom)

    const west = c.longitude - lonSpan / 2
    const east = c.longitude + lonSpan / 2
    const south = c.latitude - latSpan / 2
    const north = c.latitude + latSpan / 2

    // 加一个无害的 ref 参数用于强制刷新 iframe（规避浏览器缓存导致“看起来没定位”）
    const ref = encodeURIComponent(focused?.id ?? q.trim() ?? 'default')

    return `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik&marker=${c.latitude}%2C${c.longitude}&ref=${ref}`
  }, [center, focused, q])



  async function runSearch(keyword: string, opts?: { silent?: boolean }) {
    const city = state.city.trim()
    const kw = keyword.trim()
    if (!kw) {
      setResults([])
      setFocused(null)
      return
    }

    if (!opts?.silent) setSearching(true)
    try {
      // city 为空时不传，避免把 city='' 当成筛选条件导致无结果
      const cityParam = city ? `city=${encodeURIComponent(city)}&` : ''
      const resp = await apiFetch<{ ok: true; data: Hospital[]; total: number }>(
        `/v1/hospitals?${cityParam}q=${encodeURIComponent(kw)}&page=1&page_size=10`,
        { method: 'GET' }
      )


      setResults(resp.data)
      const first = resp.data.find((h) => Number.isFinite(h.coordinates?.lat) && Number.isFinite(h.coordinates?.lng)) ?? null
      if (first) {
        setFocused(first)
      } else if (!opts?.silent && resp.data.length) {
        Alert.alert('无法定位', '搜索到了医院，但缺少坐标信息')
      } else if (!opts?.silent && !resp.data.length) {
        Alert.alert('未找到', '没有匹配的医院，请换个关键词')
      }
    } catch (e: any) {
      setResults([])
      if (!opts?.silent) Alert.alert('搜索失败', e?.error ?? e?.message ?? '未知错误')
    } finally {
      if (!opts?.silent) setSearching(false)
    }
  }

  // 输入联想：防抖请求（输入时自动联想，不打断用户）
  useEffect(() => {
    const kw = q.trim()
    if (!kw) {
      setResults([])
      setFocused(null)
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    debounceRef.current = setTimeout(() => {
      void runSearch(kw, { silent: true })
    }, 250) as any

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, state.city])



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
      <View style={{ flex: 1, padding: theme.space[4], gap: theme.space[3] }}>
        <Text variant="title">地图</Text>

        {/* 先让地图占满上半部分；搜索栏固定在下方 */}
        <View
          style={{
            flex: 1,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.1)',
            backgroundColor: '#fff'
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/iframe-has-title */}
          <iframe key={src} src={src} style={{ width: '100%', height: '100%', border: 0 }} />
        </View>

        <Card style={{ padding: theme.space[3] }}>
          <View style={{ gap: theme.space[2] }}>
            {/* 输入框内联“搜索”按钮；无清除按钮（用户可手动删除文本） */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space[2],
                borderWidth: 1,
                borderColor: theme.color.border,
                borderRadius: theme.radius.xl,
                paddingHorizontal: theme.space[3],
                height: 44,
                backgroundColor: theme.color.background
              }}
            >
              <Text style={{ color: theme.color.mutedForeground }}>🔎</Text>
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="搜索医院名/地址关键字"
                placeholderTextColor={theme.color.mutedForeground}
                style={{ flex: 1, color: theme.color.text, paddingVertical: 0 }}
              />
              {q.trim().length ? (
                <Pressable
                  onPress={() => void runSearch(q)}
                  disabled={searching}
                  hitSlop={10}
                  style={{ opacity: searching ? 0.6 : 1 }}
                >
                  <Text style={{ color: theme.color.primary, fontWeight: '700' }}>{searching ? '搜索中…' : '搜索'}</Text>
                </Pressable>
              ) : null}
            </View>

            {focused ? (
              <View style={{ gap: 4 }}>
                <Text style={{ fontWeight: '700' }}>已定位：{focused.name}</Text>
                <Text variant="caption">{focused.address}</Text>
              </View>
            ) : null}

            {results.length ? (
              <View style={{ gap: 6 }}>
                {results.slice(0, 5).map((h) => {
                  const isActive = focused?.id === h.id
                  return (
                    <Pressable
                      key={h.id}
                      onPress={() => {
                        if (!Number.isFinite(h.coordinates?.lat) || !Number.isFinite(h.coordinates?.lng)) {
                          Alert.alert('无法定位', '该医院缺少坐标信息')
                          return
                        }
                        setFocused(h)
                      }}
                      style={{ paddingVertical: 6 }}
                    >
                      <Text
                        style={{
                          fontWeight: isActive ? '700' : '600',
                          color: isActive ? theme.color.primary : theme.color.text
                        }}
                      >
                        {h.name}
                      </Text>
                      <Text variant="caption">{h.address}</Text>
                    </Pressable>
                  )
                })}
              </View>
            ) : null}
          </View>
        </Card>

      </View>
    </SafeAreaView>
  )
}


