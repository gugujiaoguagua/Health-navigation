import React, { useState } from 'react'
import { Alert, Button, SafeAreaView, Text, TextInput, View } from 'react-native'

import { apiFetch } from '../api/client'
import type { DepartmentsResult, Hospital } from '../types/api'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from './navTypes'

type Props = NativeStackScreenProps<AppStackParamList, 'Symptom'>

export function SymptomScreen({ navigation }: Props) {
  const [city, setCity] = useState('上海')
  const [symptom, setSymptom] = useState('咳嗽两天，有点发热')
  const [loading, setLoading] = useState(false)

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>症状描述</Text>
      <Text style={{ color: '#444' }}>仅提供分诊与出行建议，不替代医生诊断；如出现胸痛/呼吸困难等急症请立即就医。</Text>

      <View style={{ gap: 8 }}>
        <Text>就医城市</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="例如：上海"
          style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text>症状描述</Text>
        <TextInput
          value={symptom}
          onChangeText={setSymptom}
          placeholder="请尽量描述：持续时间、部位、程度、伴随症状"
          multiline
          style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, minHeight: 120 }}
        />
      </View>

      <Button
        title={loading ? '分析中…' : 'AI推荐科室'}
        disabled={loading || symptom.trim().length < 2 || city.trim().length < 1}
        onPress={async () => {
          setLoading(true)
          try {
            const analysis = await apiFetch<{ ok: true } & DepartmentsResult>('/v1/ai/analyze', {
              method: 'POST',
              body: JSON.stringify({ symptom_text: symptom, context: { location_city: city } })
            })

            const departments = analysis.departments.map((d) => d.name).slice(0, 3)
            const hospitals = await apiFetch<{ ok: true; data: Hospital[]; total: number }>('/v1/hospitals/recommend', {
              method: 'POST',
              body: JSON.stringify({ departments, city })
            })

            if (!hospitals.data.length) {
              Alert.alert('暂无匹配医院', '请更换城市或尝试更通用的科室（如内科）')
              return
            }

            navigation.navigate('HospitalList', {
              city,
              departments,
              analysis
            })
          } catch (e: any) {
            Alert.alert('分析失败', e?.error ?? e?.message ?? '未知错误')
          } finally {
            setLoading(false)
          }
        }}
      />
    </SafeAreaView>
  )
}
