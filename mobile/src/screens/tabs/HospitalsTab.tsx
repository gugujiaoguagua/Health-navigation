import React, { useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, Image, Modal, Pressable, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native'



import { apiFetch } from '../../api/client'
import { useAppUI } from '../../state/AppUIContext'
import type { Hospital } from '../../types/api'
import { theme } from '../../ui/theme'
import { Badge } from '../../ui/components/Badge'
import { Button } from '../../ui/components/Button'
import { Card } from '../../ui/components/Card'
import { EmptyState } from '../../ui/components/EmptyState'
import { CityDialog } from '../../ui/components/CityDialog'
import { SearchBar } from '../../ui/components/SearchBar'
import { Text } from '../../ui/components/Text'



const DEFAULT_DEPARTMENTS = [
  '内科',
  '外科',
  '急诊科',
  '呼吸内科',
  '心内科',
  '消化内科',
  '骨科',
  '康复医学科',
  '疼痛科',
  '皮肤科',
  '妇产科',
  '儿科',
  '感染科',
  '肝病门诊'
]

const HOSPITAL_CARD_IMAGE = require('../../../assets/tab-icons/医院01.png')

// 医院卡片右侧图片：放大 10%
const HOSPITAL_CARD_IMAGE_SIZE = 80

function buildSampleHospitals(cityInput: string): Hospital[] {
  const city = cityInput.trim() || '示例市'
  return [
    {
      id: 'sample-hospital-001',
      name: `${city}第一人民医院`,
      level: '三甲',
      city,
      address: `${city}示例区示例路 1 号`,
      departments: ['急诊科', '心内科', '呼吸内科', '消化内科'],
      coordinates: { lat: 39.9042, lng: 116.4074 },
      distance_km: 2.3
    },
    {
      id: 'sample-hospital-002',
      name: `${city}中心医院`,
      level: '三甲',
      city,
      address: `${city}示例区健康大道 88 号`,
      departments: ['内科', '外科', '骨科', '康复医学科'],
      coordinates: { lat: 39.9142, lng: 116.4174 },
      distance_km: 4.8
    },
    {
      id: 'sample-hospital-003',
      name: `${city}中医院`,
      level: '三甲',
      city,
      address: `${city}示例区杏林路 66 号`,
      departments: ['内科', '康复医学科', '疼痛科'],
      coordinates: { lat: 39.8942, lng: 116.3974 },
      distance_km: 6.1
    },
    {
      id: 'sample-hospital-004',
      name: `${city}妇幼保健院`,
      level: '三甲',
      city,
      address: `${city}示例区母婴街 20 号`,
      departments: ['妇产科', '儿科', '急诊科'],
      coordinates: { lat: 39.9242, lng: 116.3874 },
      distance_km: 3.6
    },
    {
      id: 'sample-hospital-005',
      name: `${city}肿瘤医院`,
      level: '三甲',
      city,
      address: `${city}示例区生命路 108 号`,
      departments: ['内科', '外科', '呼吸内科'],
      coordinates: { lat: 39.8842, lng: 116.4274 },
      distance_km: 8.9
    },
    {
      id: 'sample-hospital-006',
      name: `${city}儿童医院`,
      level: '三甲',
      city,
      address: `${city}示例区童心路 12 号`,
      departments: ['儿科', '感染科', '急诊科'],
      coordinates: { lat: 39.9342, lng: 116.4074 },
      distance_km: 5.2
    },
    {
      id: 'sample-hospital-007',
      name: `${city}皮肤病医院`,
      level: '专科',
      city,
      address: `${city}示例区银屑路 9 号`,
      departments: ['皮肤科', '感染科'],
      coordinates: { lat: 39.9142, lng: 116.4374 },
      distance_km: 7.4
    },
    {
      id: 'sample-hospital-008',
      name: `${city}口腔医院`,
      level: '专科',
      city,
      address: `${city}示例区皓齿路 19 号`,
      departments: ['外科', '急诊科'],
      coordinates: { lat: 39.9042, lng: 116.4374 },
      distance_km: 9.7
    },
    {
      id: 'sample-hospital-009',
      name: `${city}康复医院`,
      level: '二甲',
      city,
      address: `${city}示例区复健路 77 号`,
      departments: ['康复医学科', '疼痛科', '骨科'],
      coordinates: { lat: 39.8942, lng: 116.4274 },
      distance_km: 11.2
    },
    {
      id: 'sample-hospital-010',
      name: `${city}传染病医院`,
      level: '三乙',
      city,
      address: `${city}示例区防疫路 5 号`,
      departments: ['感染科', '肝病门诊', '急诊科'],
      coordinates: { lat: 39.9242, lng: 116.4174 },
      distance_km: 13.5
    }
  ]
}



export function HospitalsTab({
  onOpenPlan
}: {
  onOpenPlan: (hospitalId: string, city: string) => void
}) {
  const { state, setCity } = useAppUI()

  const [department, setDepartment] = useState(state.departments[0] ?? '')
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<Hospital[]>([])

  const [cityDialogOpen, setCityDialogOpen] = useState(false)

  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false)
  const [departmentQuery, setDepartmentQuery] = useState('')

  const [hospitalDialogOpen, setHospitalDialogOpen] = useState(false)
  const [hospitalQuery, setHospitalQuery] = useState('')
  const [hospitalOptionsLoading, setHospitalOptionsLoading] = useState(false)
  const [hospitalOptions, setHospitalOptions] = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)

  const sampleHospitals = useMemo(() => buildSampleHospitals(state.city), [state.city])

  useEffect(() => {
    // prefer last recommended result
    if (state.recommended.length) {
      setList(state.recommended)
    }
  }, [state.recommended])

  useEffect(() => {
    if (state.recommended.length) return
    setList((prev) => (prev.length ? prev : sampleHospitals))
  }, [sampleHospitals, state.recommended.length])

  useEffect(() => {
    if (!departmentDialogOpen) return
    setDepartmentQuery('')
  }, [departmentDialogOpen])


  useEffect(() => {
    if (!hospitalDialogOpen) return
    setHospitalQuery('')
  }, [hospitalDialogOpen])

  useEffect(() => {
    // 城市/科室变化时：刷新该城市可选医院列表，并清理不匹配的已选医院
    const city = state.city.trim()
    if (!city) {
      setHospitalOptions([])
      setSelectedHospital(null)
      return
    }

    let cancelled = false
    ;(async () => {
      setHospitalOptionsLoading(true)
      try {
        const url = `/v1/hospitals?city=${encodeURIComponent(city)}${
          department.trim() ? `&department=${encodeURIComponent(department.trim())}` : ''
        }`
        const resp = await apiFetch<{ ok: true; data: Hospital[]; total: number }>(url, { method: 'GET' })
        if (cancelled) return
        setHospitalOptions(resp.data)

        // 已选医院不在当前选项里则清空
        setSelectedHospital((prev) => (prev && resp.data.some((h) => h.id === prev.id) ? prev : null))
      } catch {
        if (cancelled) return
        setHospitalOptions([])
        setSelectedHospital(null)
      } finally {
        if (!cancelled) setHospitalOptionsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [department, state.city])




  const subtitle = useMemo(() => {
    const parts: string[] = []
    if (department.trim()) parts.push(`科室：${department.trim()}`)
    if (state.analysis?.model) parts.push(`模型：${state.analysis.model}`)
    return parts.join('  |  ')
  }, [department, state.analysis?.model])

  const departmentOptions = useMemo(() => {
    const picked = (state.departments ?? []).map((d) => d.trim()).filter(Boolean)
    const base = DEFAULT_DEPARTMENTS
    const all = [...picked, ...base]
    const uniq: string[] = []
    for (const d of all) {
      if (!uniq.includes(d)) uniq.push(d)
    }
    return uniq
  }, [state.departments])

  const filteredDepartments = useMemo(() => {
    const q = departmentQuery.trim()
    if (!q) return departmentOptions
    return departmentOptions.filter((d) => d.includes(q))
  }, [departmentOptions, departmentQuery])

  const filteredHospitals = useMemo(() => {
    const q = hospitalQuery.trim()
    if (!q) return hospitalOptions
    return hospitalOptions.filter((h) => h.name.includes(q) || h.address.includes(q))
  }, [hospitalOptions, hospitalQuery])



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
      <View style={{ flex: 1, padding: theme.space[4], gap: theme.space[3] }}>
        <View style={{ gap: 4 }}>
          <Text variant="title">医院</Text>
          {subtitle ? <Text variant="muted">{subtitle}</Text> : <Text variant="muted">按城市与科室筛选，查看推荐医院</Text>}
          {state.analysis?.emergency_warning ? (
            <Text style={{ color: theme.color.destructive, fontWeight: '700' }}>存在急症信号：建议优先急诊就医</Text>
          ) : null}
        </View>

        <Card>
          <View style={{ gap: theme.space[3] }}>
            <Button title={`城市：${state.city || '未设置'}（点击修改）`} variant="outline" onPress={() => setCityDialogOpen(true)} />

            <Button
              title={department.trim() ? `科室：${department.trim()}（点击修改）` : '科室：不限（点击选择）'}
              variant="outline"
              onPress={() => setDepartmentDialogOpen(true)}
            />

            <Button
              title={
                selectedHospital
                  ? `医院：${selectedHospital.name}（点击修改）`
                  : hospitalOptionsLoading
                    ? '医院：加载中…'
                    : '医院：不限（点击选择）'
              }
              variant="outline"
              onPress={() => {
                if (!state.city.trim()) {
                  Alert.alert('请先选择城市', '选择城市后才能查看可选医院')
                  setCityDialogOpen(true)
                  return
                }
                setHospitalDialogOpen(true)
              }}
            />

            <Button
              title={loading ? '查询中…' : '查询'}
              loading={loading}
              variant="outline"
              onPress={async () => {
                setLoading(true)
                try {
                  const url = `/v1/hospitals?city=${encodeURIComponent(state.city)}${
                    department.trim() ? `&department=${encodeURIComponent(department.trim())}` : ''
                  }${selectedHospital ? `&q=${encodeURIComponent(selectedHospital.name)}` : ''}`
                  const resp = await apiFetch<{ ok: true; data: Hospital[]; total: number }>(url, { method: 'GET' })
                  setList(resp.data)
                } catch (e: any) {
                  Alert.alert('加载失败', e?.error ?? '未知错误')
                } finally {
                  setLoading(false)
                }
              }}
            />

          </View>
        </Card>


        <CityDialog
          visible={cityDialogOpen}
          value={state.city}
          onClose={() => setCityDialogOpen(false)}
          onSelect={(c) => setCity(c)}
        />

        <Modal
          visible={departmentDialogOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDepartmentDialogOpen(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.35)',
              padding: theme.space[4],
              justifyContent: 'center'
            }}
          >
            <Card style={{ padding: theme.space[4], gap: theme.space[3] }}>
              <View style={{ gap: 4 }}>
                <Text variant="h2">选择科室</Text>
                <Text variant="caption">当前：{department.trim() || '不限'}</Text>
                {state.departments?.length ? <Text variant="caption">推荐：{state.departments.join(' / ')}</Text> : null}
              </View>

              <SearchBar
                value={departmentQuery}
                onChangeText={setDepartmentQuery}
                placeholder="搜索科室"
                onClear={() => setDepartmentQuery('')}
              />

              <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 8 }}>
                {/* 不限 */}
                <Pressable
                  key="__all__"
                  onPress={() => {
                    setDepartment('')
                    setDepartmentDialogOpen(false)
                  }}
                  style={({ pressed }) => [
                    {
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: theme.radius.lg,
                      backgroundColor: !department.trim() ? theme.color.secondary : theme.color.background,
                      borderWidth: 1,
                      borderColor: !department.trim() ? theme.color.primary : theme.color.border
                    },
                    pressed ? { opacity: 0.85 } : null
                  ]}
                >
                  <Text style={{ color: !department.trim() ? theme.color.primary : theme.color.text, fontWeight: '600' }}>不限</Text>
                </Pressable>

                {filteredDepartments.map((d) => {
                  const active = d === department
                  return (
                    <Pressable
                      key={d}
                      onPress={() => {
                        setDepartment(d)
                        setDepartmentDialogOpen(false)
                      }}
                      style={({ pressed }) => [
                        {
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: theme.radius.lg,
                          backgroundColor: active ? theme.color.secondary : theme.color.background,
                          borderWidth: 1,
                          borderColor: active ? theme.color.primary : theme.color.border
                        },
                        pressed ? { opacity: 0.85 } : null
                      ]}
                    >
                      <Text style={{ color: active ? theme.color.primary : theme.color.text, fontWeight: '600' }}>{d}</Text>
                    </Pressable>
                  )
                })}

                {!filteredDepartments.length ? <Text variant="caption">暂无匹配科室</Text> : null}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
                <View style={{ flex: 1 }}>
                  <Button title="关闭" variant="outline" onPress={() => setDepartmentDialogOpen(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="清空科室"
                    variant="secondary"
                    onPress={() => {
                      setDepartment('')
                      setDepartmentDialogOpen(false)
                    }}
                  />
                </View>
              </View>
            </Card>
          </View>
        </Modal>

        <Modal
          visible={hospitalDialogOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setHospitalDialogOpen(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.35)',
              padding: theme.space[4],
              justifyContent: 'center'
            }}
          >
            <Card style={{ padding: theme.space[4], gap: theme.space[3] }}>
              <View style={{ gap: 4 }}>
                <Text variant="h2">选择医院</Text>
                <Text variant="caption">
                  城市：{state.city || '未设置'}{department.trim() ? `  |  科室：${department.trim()}` : ''}
                </Text>
                <Text variant="caption">当前：{selectedHospital?.name ?? '不限'}</Text>
              </View>

              <SearchBar
                value={hospitalQuery}
                onChangeText={setHospitalQuery}
                placeholder="搜索医院名/地址"
                onClear={() => setHospitalQuery('')}
              />

              <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 8 }}>
                {/* 不限 */}
                <Pressable
                  key="__all_hospital__"
                  onPress={() => {
                    setSelectedHospital(null)
                    setHospitalDialogOpen(false)
                  }}
                  style={({ pressed }) => [
                    {
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: theme.radius.lg,
                      backgroundColor: !selectedHospital ? theme.color.secondary : theme.color.background,
                      borderWidth: 1,
                      borderColor: !selectedHospital ? theme.color.primary : theme.color.border
                    },
                    pressed ? { opacity: 0.85 } : null
                  ]}
                >
                  <Text style={{ color: !selectedHospital ? theme.color.primary : theme.color.text, fontWeight: '600' }}>不限</Text>
                </Pressable>

                {filteredHospitals.map((h) => {
                  const active = selectedHospital?.id === h.id
                  return (
                    <Pressable
                      key={h.id}
                      onPress={() => {
                        setSelectedHospital(h)
                        setHospitalDialogOpen(false)
                      }}
                      style={({ pressed }) => [
                        {
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: theme.radius.lg,
                          backgroundColor: active ? theme.color.secondary : theme.color.background,
                          borderWidth: 1,
                          borderColor: active ? theme.color.primary : theme.color.border
                        },
                        pressed ? { opacity: 0.85 } : null
                      ]}
                    >
                      <Text style={{ color: active ? theme.color.primary : theme.color.text, fontWeight: '700' }}>{h.name}</Text>
                      <Text variant="caption">{h.address}</Text>
                    </Pressable>
                  )
                })}

                {hospitalOptionsLoading ? <Text variant="caption">加载中…</Text> : null}
                {!hospitalOptionsLoading && !filteredHospitals.length ? <Text variant="caption">暂无可选医院</Text> : null}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
                <View style={{ flex: 1 }}>
                  <Button title="关闭" variant="outline" onPress={() => setHospitalDialogOpen(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="清空医院"
                    variant="secondary"
                    onPress={() => {
                      setSelectedHospital(null)
                      setHospitalDialogOpen(false)
                    }}
                  />
                </View>
              </View>
            </Card>
          </View>
        </Modal>


        <FlatList


          data={list}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <EmptyState title={loading ? '加载中…' : '暂无结果'} description="尝试调整城市、科室或搜索关键词" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onOpenPlan(item.id, state.city)} style={{ marginBottom: 10 }}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 16, fontWeight: '700' }}>{item.name}</Text>
                      {item.level ? <Badge label={item.level} variant="secondary" /> : null}
                    </View>
                    <Text variant="muted">{item.address}</Text>
                    <Text variant="caption" numberOfLines={1}>
                      科室：{item.departments.join('、')}
                    </Text>
                    {typeof item.distance_km === 'number' ? (
                      <Text variant="caption">距离：{item.distance_km.toFixed(1)} km</Text>
                    ) : null}
                  </View>

                  {/* 右侧医院图 */}
                  <Image
                    source={HOSPITAL_CARD_IMAGE}
                    resizeMode="cover"
                    style={{
                      width: HOSPITAL_CARD_IMAGE_SIZE,
                      height: HOSPITAL_CARD_IMAGE_SIZE,
                      borderRadius: 14,
                      backgroundColor: theme.color.muted
                    }}
                  />

                </View>
              </Card>
            </TouchableOpacity>
          )}

        />
      </View>
    </SafeAreaView>
  )
}
