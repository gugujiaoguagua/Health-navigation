import React, { useMemo } from 'react'
import { Alert, Platform, Pressable, SafeAreaView, ScrollView, View, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import type { AppStackParamList } from '../navTypes'
import { useAppUI } from '../../state/AppUIContext'
import { theme } from '../../ui/theme'
import { Button } from '../../ui/components/Button'
import { Card } from '../../ui/components/Card'
import { Text } from '../../ui/components/Text'

export function SurroundingsTab() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const { state, removeItinerary, togglePinItinerary } = useAppUI()
  const list = useMemo(() => {
    return [...state.savedItineraries].sort((a, b) => {
      // 1. 置顶优先
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      // 2. 时间倒序
      return b.savedAt - a.savedAt
    })
  }, [state.savedItineraries])
  const titled = useMemo(() => {
    const counters = new Map<string, number>()
    return list.map((it) => {
      const key = it.hospitalId?.trim() || it.hospitalName?.trim() || it.itineraryId
      const nextCount = (counters.get(key) ?? 0) + 1
      counters.set(key, nextCount)
      const baseName = it.hospitalName?.trim() || '行程'
      const title = nextCount > 1 ? `${baseName} 行程${nextCount}` : baseName
      return { it, title }
    })
  }, [list])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
      <ScrollView contentContainerStyle={{ padding: theme.space[4], gap: theme.space[3], paddingBottom: 28 }}>
        <Text variant="title">行程</Text>

        {!list.length ? (
          <Card>
            <Text variant="muted">暂无已保存行程。去生成清单后点「加入行程」会自动保存到这里。</Text>
          </Card>
        ) : null}

        {titled.map(({ it, title }) => {
          const savedAtText = Number.isFinite(it.savedAt) ? new Date(it.savedAt).toLocaleString() : '-'
          return (
            <Pressable
              key={it.itineraryId}
              onPress={() => navigation.navigate('ItineraryDetail', { itineraryId: it.itineraryId })}
              style={({ pressed }) => [pressed ? { opacity: 0.92 } : null]}
            >
              <Card style={{ gap: theme.space[2] }}>
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontWeight: '700', flex: 1 }}>{title}</Text>
                    <Pressable
                      onPress={() => togglePinItinerary(it.itineraryId)}
                      style={({ pressed }) => [
                        {
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                          backgroundColor: it.isPinned ? theme.color.primary : 'rgba(0,0,0,0.05)'
                        },
                        pressed && { opacity: 0.7 }
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: it.isPinned ? '#fff' : theme.color.mutedForeground
                        }}
                      >
                        {it.isPinned ? '已置顶' : '置顶'}
                      </Text>
                    </Pressable>
                  </View>
                  <Text variant="caption">行程ID：{it.itineraryId}</Text>
                  <Text variant="caption">天数：{it.days}  |  保存时间：{savedAtText}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
                  <View style={{ flex: 1 }}>
                    <Button title="查看行程" variant="outline" onPress={() => navigation.navigate('ItineraryDetail', { itineraryId: it.itineraryId })} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="删除"
                      variant="primary"
                      onPress={() => {
                        if (Platform.OS === 'web') {
                          if (confirm('确认删除该行程吗？')) {
                            removeItinerary(it.itineraryId)
                          }
                          return
                        }
                        Alert.alert('删除行程', '确认删除该行程吗？', [
                          { text: '取消', style: 'cancel' },
                          { text: '删除', style: 'destructive', onPress: async () => removeItinerary(it.itineraryId) }
                        ])
                      }}
                    />
                  </View>
                </View>
              </Card>
            </Pressable>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}
