import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native'

import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useAppUI } from '../state/AppUIContext'
import type { Checklist } from '../types/api'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from './navTypes'

type Props = NativeStackScreenProps<AppStackParamList, 'Checklist'>

export function ChecklistScreen({ route, navigation }: Props) {
  const { itineraryId, days, hospitalId, hospitalName, plan } = route.params
  const { setToken } = useAuth()
  const { state, saveItinerary } = useAppUI()
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading] = useState(false)
  const [custom, setCustom] = useState('')
  const saved = useMemo(() => state.savedItineraries.find((x) => x.itineraryId === itineraryId) ?? null, [itineraryId, state.savedItineraries])
  const isSaved = Boolean(saved)

  useEffect(() => {
    if (saved?.checklist) {
      setChecklist(saved.checklist)
      return
    }
    ;(async () => {
      setLoading(true)
      try {
        const resp = await apiFetch<{ ok: true; checklist: Checklist }>('/v1/checklists/generate', {
          method: 'POST',
          body: JSON.stringify({ itinerary_id: itineraryId, days })
        })
        setChecklist(resp.checklist)
      } catch (e: any) {
        if (String(e?.error ?? '') === 'UNAUTHORIZED') {
          Alert.alert('登录已过期', '请重新登录后再试')
          await setToken(null)
          return
        }
        Alert.alert('加载失败', e?.error ?? '未知错误')
      } finally {
        setLoading(false)
      }
    })()
  }, [days, itineraryId, saved?.checklist, setToken])

  useEffect(() => {
    if (!isSaved || !checklist) return
    if (checklist === saved?.checklist) return
    void saveItinerary({
      itineraryId,
      days: saved?.days ?? days,
      hospitalId: saved?.hospitalId ?? hospitalId,
      hospitalName: saved?.hospitalName ?? hospitalName,
      plan: saved?.plan ?? plan,
      checklist
    })
  }, [checklist, days, hospitalId, hospitalName, isSaved, itineraryId, plan, saveItinerary, saved?.checklist, saved?.days, saved?.hospitalId, saved?.hospitalName, saved?.plan])

  const items = useMemo(() => {
    if (!checklist) return []
    return checklist.categories.flatMap((c) => c.items.map((i) => ({ category: c.category, item: i })))
  }, [checklist])

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ gap: 12, paddingBottom: 72 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ fontSize: 22, fontWeight: '600' }}>就医行程清单</Text>
          <Text style={{ color: '#444' }}>版本：{checklist?.version ?? '-'}  |  项目数：{items.length}</Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              value={custom}
              onChangeText={setCustom}
              placeholder="添加自定义物品（默认加到“其他”）"
              style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8 }}
            />
            <Button
              title="添加"
              disabled={!checklist || !custom.trim()}
              onPress={() => {
                if (!checklist) return
                const name = custom.trim()
                setCustom('')
                const next: Checklist = {
                  ...checklist,
                  categories: checklist.categories.map((c) =>
                    c.category === '其他'
                      ? { ...c, items: [...c.items, { name, checked: false }] }
                      : c
                  )
                }
                setChecklist(next)
              }}
            />
          </View>

          {items.length ? (
            <View>
              {items.map((row) => (
                <Pressable
                  key={`${row.category}:${row.item.name}`}
                  onPress={() => {
                    if (!checklist) return
                    const next: Checklist = {
                      ...checklist,
                      categories: checklist.categories.map((c) =>
                        c.category !== row.category
                          ? c
                          : {
                              ...c,
                              items: c.items.map((it) =>
                                it.name === row.item.name ? { ...it, checked: !it.checked } : it
                              )
                            }
                      )
                    }
                    setChecklist(next)
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#eee'
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600' }}>{row.item.name}</Text>
                    <Text style={{ color: '#666', marginTop: 2 }}>{row.category}</Text>
                  </View>
                  <Text style={{ fontSize: 18 }}>{row.item.checked ? '✓' : '○'}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={{ color: '#666' }}>{loading ? '加载中…' : '暂无数据'}</Text>
          )}
        </ScrollView>

        <View style={{ paddingTop: 12 }}>
          <Button
            title={isSaved ? '完成' : '加入行程'}
            disabled={!isSaved && (!checklist || loading)}
            onPress={async () => {
              if (isSaved) {
                navigation.goBack()
                return
              }
              await saveItinerary({ itineraryId, days, hospitalId, hospitalName, plan, checklist: checklist ?? undefined })
              navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { initialTab: 'surroundings' } }] })
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}
