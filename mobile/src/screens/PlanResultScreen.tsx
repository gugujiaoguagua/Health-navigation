import React, { useMemo, useState } from 'react'
import { Alert, Button, SafeAreaView, Text, View } from 'react-native'

import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Checklist } from '../types/api'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from './navTypes'

type Props = NativeStackScreenProps<AppStackParamList, 'PlanResult'>

export function PlanResultScreen({ navigation, route }: Props) {
  const { itineraryId, plan, departureDate, returnDate, hospitalId, hospitalName } = route.params
  const { setToken } = useAuth()
  const [loading, setLoading] = useState(false)

  const days = useMemo(() => {
    const s = new Date(departureDate).getTime()
    const e = new Date(returnDate).getTime()
    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return 1
    return Math.max(1, Math.ceil((e - s) / (24 * 3600 * 1000)))
  }, [departureDate, returnDate])

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>行程结果</Text>

      <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, gap: 6 }}>
        <Text style={{ fontWeight: '600' }}>路线</Text>
        <Text>方式：{plan.route.mode}</Text>
        <Text>
          距离：{plan.route.distance_km}km  |  时长：{plan.route.duration_min}分钟
        </Text>
      </View>

      <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, gap: 6 }}>
        <Text style={{ fontWeight: '600' }}>住宿（3个候选）</Text>
        {plan.accommodation.map((h) => (
          <Text key={h.id}>
            {h.name}：¥{h.price_per_night}/晚 × {h.nights}晚
          </Text>
        ))}
      </View>

      <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, gap: 6 }}>
        <Text style={{ fontWeight: '600' }}>餐饮（5个候选）</Text>
        {plan.dining.map((d) => (
          <Text key={d.id}>
            {d.name}：人均¥{d.avg_price}（{d.tags.join('、')}）
          </Text>
        ))}
      </View>

      <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, gap: 6 }}>
        <Text style={{ fontWeight: '600' }}>费用预估</Text>
        <Text>交通：¥{plan.cost_estimate.transport}</Text>
        <Text>住宿：¥{plan.cost_estimate.accommodation}</Text>
        <Text>餐饮：¥{plan.cost_estimate.dining}</Text>
      </View>

      <Button
        title={loading ? '生成中…' : '生成就医清单'}
        disabled={loading}
        onPress={async () => {
          setLoading(true)
          try {
            const resp = await apiFetch<{ ok: true; checklist: Checklist }>('/v1/checklists/generate', {
              method: 'POST',
              body: JSON.stringify({ itinerary_id: itineraryId, days })
            })
            navigation.navigate('Checklist', { itineraryId, days, hospitalId, hospitalName, plan })
            void resp
          } catch (e: any) {
            if (String(e?.error ?? '') === 'UNAUTHORIZED') {
              Alert.alert('登录已过期', '请重新登录后再试')
              await setToken(null)
              return
            }
            Alert.alert('生成失败', e?.error ?? e?.message ?? '未知错误')
          } finally {
            setLoading(false)
          }
        }}
      />
    </SafeAreaView>
  )
}
