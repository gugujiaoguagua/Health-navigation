import React, { useEffect, useState } from 'react'
import { Alert, Button, FlatList, SafeAreaView, Text, TouchableOpacity, View } from 'react-native'

import { apiFetch } from '../api/client'
import type { Hospital } from '../types/api'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from './navTypes'

type Props = NativeStackScreenProps<AppStackParamList, 'HospitalList'>

export function HospitalListScreen({ navigation, route }: Props) {
  const { city, departments, analysis } = route.params
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const resp = await apiFetch<{ ok: true; data: Hospital[]; total: number }>('/v1/hospitals/recommend', {
          method: 'POST',
          body: JSON.stringify({ city, departments })
        })
        setHospitals(resp.data)
      } catch (e: any) {
        Alert.alert('加载失败', e?.error ?? '未知错误')
      } finally {
        setLoading(false)
      }
    })()
  }, [city, departments])

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>推荐医院</Text>
      <Text style={{ color: '#444' }}>
        推荐科室：{departments.join(' / ')}  |  模型：{analysis.model}
      </Text>
      {analysis.emergency_warning ? <Text style={{ color: '#b00020' }}>存在急症信号：建议优先急诊就医</Text> : null}

      <FlatList
        data={hospitals}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 10 }}
            onPress={() => navigation.navigate('Plan', { hospitalId: item.id, city })}
          >
            <Text style={{ fontSize: 16, fontWeight: '600' }}>
              {item.name} {item.level ? `·${item.level}` : ''}
            </Text>
            <Text style={{ color: '#444', marginTop: 4 }}>{item.address}</Text>
            <Text style={{ color: '#666', marginTop: 6 }} numberOfLines={1}>
              科室：{item.departments.join('、')}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#666' }}>{loading ? '加载中…' : '暂无数据'}</Text>}
      />

      <View style={{ paddingTop: 8 }}>
        <Button title="返回重新输入" onPress={() => navigation.popToTop()} />
      </View>
    </SafeAreaView>
  )
}

