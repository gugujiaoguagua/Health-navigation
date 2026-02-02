import React, { useMemo } from 'react'
import { SafeAreaView, ScrollView, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { useAppUI } from '../state/AppUIContext'
import { Button } from '../ui/components/Button'
import { Card } from '../ui/components/Card'
import { Text } from '../ui/components/Text'
import { theme } from '../ui/theme'
import type { AppStackParamList } from './navTypes'

type Props = NativeStackScreenProps<AppStackParamList, 'ItineraryDetail'>

export function ItineraryDetailScreen({ route, navigation }: Props) {
  const { itineraryId } = route.params
  const { state } = useAppUI()

  const itinerary = useMemo(() => state.savedItineraries.find((x) => x.itineraryId === itineraryId) ?? null, [itineraryId, state.savedItineraries])
  const plan = itinerary?.plan
  const checklist = itinerary?.checklist

  const selectedAccommodation = useMemo(() => {
    if (!plan?.accommodation?.length) return null
    const id = itinerary?.selectedAccommodationId?.trim()
    if (id) return plan.accommodation.find((a) => a.id === id) ?? plan.accommodation[0]
    return plan.accommodation[0]
  }, [itinerary?.selectedAccommodationId, plan?.accommodation])

  const checkedChecklist = useMemo(() => {
    if (!checklist) return { categories: [] as { category: string; items: { name: string; checked: boolean }[] }[], count: 0 }
    const categories = checklist.categories
      .map((c) => ({ category: c.category, items: (c.items ?? []).filter((it) => it.checked) }))
      .filter((c) => c.items.length > 0)
    const count = categories.reduce((acc, c) => acc + c.items.length, 0)
    return { categories, count }
  }, [checklist])

  const bill = useMemo(() => {
    if (!plan) return null
    const accommodationCost = selectedAccommodation
      ? selectedAccommodation.price_per_night * selectedAccommodation.nights
      : 0
    const transportCost = plan.cost_estimate?.transport ?? 0
    const total = accommodationCost + transportCost
    return { accommodationCost, transportCost, total }
  }, [plan, selectedAccommodation])

  if (!itinerary) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
        <View style={{ flex: 1, padding: theme.space[4], gap: theme.space[3] }}>
          <Text variant="title">行程详情</Text>
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
      <ScrollView
        contentContainerStyle={{ padding: theme.space[4], gap: theme.space[3], paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title" style={{ marginBottom: theme.space[1] }}>{itinerary.hospitalName?.trim() || '行程详情'}</Text>

        <Card style={{ gap: 6 }}>
          <Text variant="caption">行程ID：{itinerary.itineraryId}</Text>
          <Text variant="caption">天数：{itinerary.days}</Text>
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={{ fontWeight: '700' }}>路线</Text>
          {plan ? (
            <View style={{ gap: 4 }}>
              <Text>方式：{plan.route.mode}</Text>
              <Text>
                距离：{plan.route.distance_km}km  |  时长：{plan.route.duration_min}分钟
              </Text>
            </View>
          ) : (
            <Text variant="muted">暂无路线信息</Text>
          )}
        </Card>

        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Text style={{ fontWeight: '700' }}>住宿</Text>
            <Button
              title="修改住宿"
              variant="outline"
              disabled={!plan?.accommodation?.length}
              onPress={() => navigation.navigate('ItineraryAccommodationEdit', { itineraryId })}
              style={{ height: 36, paddingHorizontal: 12 }}
            />
          </View>

          {plan?.accommodation?.length ? (
            selectedAccommodation ? (
              <View style={{ gap: 4 }}>
                <Text style={{ fontWeight: '700' }}>{selectedAccommodation.name}</Text>
                <Text variant="caption">
                  ¥{selectedAccommodation.price_per_night}/晚 × {selectedAccommodation.nights}晚
                </Text>
                <Text variant="caption">候选：{plan.accommodation.map((a) => a.name).join(' / ')}</Text>
              </View>
            ) : (
              <Text variant="muted">暂无住宿信息</Text>
            )
          ) : (
            <Text variant="muted">暂无住宿信息</Text>
          )}
        </Card>

        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Text style={{ fontWeight: '700' }}>账单</Text>
          </View>
          {bill ? (
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="caption">交通费用</Text>
                <Text variant="caption">¥{bill.transportCost}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="caption">住宿费用</Text>
                <Text variant="caption">¥{bill.accommodationCost}</Text>
              </View>
              <View style={{ height: 1, backgroundColor: theme.color.border, marginVertical: 4 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700' }}>总计</Text>
                <Text style={{ fontWeight: '700', color: theme.color.primary, fontSize: 18 }}>¥{bill.total}</Text>
              </View>
            </View>
          ) : (
            <Text variant="muted">暂无账单信息</Text>
          )}
        </Card>

        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Text style={{ fontWeight: '700' }}>行程清单</Text>
            <Button
              title="修改清单"
              variant="outline"
              onPress={() =>
                navigation.navigate('Checklist', {
                  itineraryId,
                  days: itinerary.days,
                  hospitalId: itinerary.hospitalId,
                  hospitalName: itinerary.hospitalName,
                  plan: itinerary.plan
                })
              }
              style={{ height: 36, paddingHorizontal: 12 }}
            />
          </View>

          {checklist ? (
            <View style={{ gap: 10 }}>
              <Text variant="caption">
                版本：{checklist.version}  |  项目数：{checkedChecklist.count}
              </Text>

              {checkedChecklist.count ? (
                <View style={{ gap: 12 }}>
                  {checkedChecklist.categories.map((c) => (
                    <View key={c.category} style={{ gap: 6 }}>
                      <Text style={{ fontWeight: '700' }}>{c.category}</Text>
                      <View style={{ gap: 6 }}>
                        {c.items.map((it) => (
                          <View key={`${c.category}:${it.name}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                            <Text style={{ flex: 1 }}>{it.name}</Text>
                            <Text style={{ width: 24, textAlign: 'right' }}>✓</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text variant="muted">暂无已选择项目</Text>
              )}
            </View>
          ) : (
            <Text variant="muted">暂无清单信息</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}
