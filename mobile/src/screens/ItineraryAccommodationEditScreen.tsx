import React, { useMemo, useState } from 'react'
import { Pressable, SafeAreaView, ScrollView, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { useAppUI } from '../state/AppUIContext'
import { Button } from '../ui/components/Button'
import { Card } from '../ui/components/Card'
import { Text } from '../ui/components/Text'
import { theme } from '../ui/theme'
import type { AppStackParamList } from './navTypes'

type Props = NativeStackScreenProps<AppStackParamList, 'ItineraryAccommodationEdit'>

export function ItineraryAccommodationEditScreen({ route, navigation }: Props) {
  const { itineraryId } = route.params
  const { state, saveItinerary } = useAppUI()

  const itinerary = useMemo(() => state.savedItineraries.find((x) => x.itineraryId === itineraryId) ?? null, [itineraryId, state.savedItineraries])
  const options = itinerary?.plan?.accommodation ?? []

  const [selectedId, setSelectedId] = useState(() => {
    const current = itinerary?.selectedAccommodationId?.trim()
    if (current) return current
    const first = options[0]?.id
    return first ? String(first) : ''
  })

  if (!itinerary) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
        <View style={{ flex: 1, padding: theme.space[4], gap: theme.space[3] }}>
          <Text variant="title">修改住宿</Text>
          <Card>
            <Text variant="muted">该行程不存在或已被删除。</Text>
          </Card>
          <Button title="返回" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
      <ScrollView contentContainerStyle={{ padding: theme.space[4], gap: theme.space[3], paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Text variant="title">修改住宿</Text>
        <Text variant="caption">行程ID：{itinerary.itineraryId}</Text>

        {!options.length ? (
          <Card>
            <Text variant="muted">暂无住宿候选。</Text>
          </Card>
        ) : (
          <View style={{ gap: theme.space[3] }}>
            {options.map((a) => {
              const active = a.id === selectedId
              return (
                <Pressable
                  key={a.id}
                  onPress={() => setSelectedId(a.id)}
                  style={({ pressed }) => [pressed ? { opacity: 0.92 } : null]}
                >
                  <Card
                    style={{
                      gap: 6,
                      borderWidth: 1,
                      borderColor: active ? theme.color.primary : theme.color.border,
                      backgroundColor: active ? 'rgba(15,118,110,0.08)' : theme.color.background
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                      <Text style={{ fontWeight: '700', flex: 1 }}>{a.name}</Text>
                      <Text style={{ fontWeight: '700' }}>{active ? '✓' : ''}</Text>
                    </View>
                    <Text variant="caption">
                      ¥{a.price_per_night}/晚 × {a.nights}晚
                    </Text>
                  </Card>
                </Pressable>
              )
            })}
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
          <View style={{ flex: 1 }}>
            <Button title="取消" variant="outline" onPress={() => navigation.goBack()} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="保存"
              disabled={!options.length || !selectedId}
              onPress={async () => {
                await saveItinerary({
                  itineraryId: itinerary.itineraryId,
                  days: itinerary.days,
                  hospitalId: itinerary.hospitalId,
                  hospitalName: itinerary.hospitalName,
                  plan: itinerary.plan,
                  checklist: itinerary.checklist,
                  selectedAccommodationId: selectedId
                })
                navigation.goBack()
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

