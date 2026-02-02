import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  View,
  useWindowDimensions
} from 'react-native'

import { apiFetch } from '../api/client'
import type { Hospital } from '../types/api'
import type { ItineraryPlan } from '../types/api'
import { Card } from '../ui/components/Card'
import { Button } from '../ui/components/Button'
import { Text } from '../ui/components/Text'
import { theme } from '../ui/theme'
import { useAuth } from '../auth/AuthContext'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from './navTypes'

type Props = NativeStackScreenProps<AppStackParamList, 'Plan'>

export function PlanScreen({ route, navigation }: Props) {
  const { hospitalId, city } = route.params
  const { setToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [dateOpen, setDateOpen] = useState(false)
  const [datePickerTarget, setDatePickerTarget] = useState<'departure' | 'return' | null>(null)
  const [datePickerYear, setDatePickerYear] = useState(() => new Date().getFullYear())
  const [datePickerMonth, setDatePickerMonth] = useState(() => new Date().getMonth())
  const [departureDate, setDepartureDate] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000)
    return d.toISOString().slice(0, 10)
  })
  const [planning, setPlanning] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()

  const bodyUp = Math.round(theme.font.body * 1.1)
  const captionUp = Math.round(theme.font.caption * 1.1)

  // 10个示例医院数据（与 HospitalsTab 保持一致，用于本地加载）
  const sampleHospitalData = useMemo(() => {
    const c = city.trim() || '示例市'
    return [
      {
        id: 'sample-hospital-001',
        name: `${c}第一人民医院`,
        level: '三甲',
        city: c,
        address: `${c}示例区示例路 1 号`,
        departments: ['急诊科', '心内科', '呼吸内科', '消化内科'],
        coordinates: { lat: 39.9042, lng: 116.4074 },
        distance_km: 2.3
      },
      {
        id: 'sample-hospital-002',
        name: `${c}中心医院`,
        level: '三甲',
        city: c,
        address: `${c}示例区健康大道 88 号`,
        departments: ['内科', '外科', '骨科', '康复医学科'],
        coordinates: { lat: 39.9142, lng: 116.4174 },
        distance_km: 4.8
      },
      {
        id: 'sample-hospital-003',
        name: `${c}中医院`,
        level: '三甲',
        city: c,
        address: `${c}示例区杏林路 66 号`,
        departments: ['内科', '康复医学科', '疼痛科'],
        coordinates: { lat: 39.8942, lng: 116.3974 },
        distance_km: 6.1
      },
      {
        id: 'sample-hospital-004',
        name: `${c}妇幼保健院`,
        level: '三甲',
        city: c,
        address: `${c}示例区母婴街 20 号`,
        departments: ['妇产科', '儿科', '急诊科'],
        coordinates: { lat: 39.9242, lng: 116.3874 },
        distance_km: 3.6
      },
      {
        id: 'sample-hospital-005',
        name: `${c}肿瘤医院`,
        level: '三甲',
        city: c,
        address: `${c}示例区生命路 108 号`,
        departments: ['内科', '外科', '呼吸内科'],
        coordinates: { lat: 39.8842, lng: 116.4274 },
        distance_km: 8.9
      },
      {
        id: 'sample-hospital-006',
        name: `${c}儿童医院`,
        level: '三甲',
        city: c,
        address: `${c}示例区童心路 12 号`,
        departments: ['儿科', '感染科', '急诊科'],
        coordinates: { lat: 39.9342, lng: 116.4074 },
        distance_km: 5.2
      },
      {
        id: 'sample-hospital-007',
        name: `${c}皮肤病医院`,
        level: '专科',
        city: c,
        address: `${c}示例区银屑路 9 号`,
        departments: ['皮肤科', '感染科'],
        coordinates: { lat: 39.9142, lng: 116.4374 },
        distance_km: 7.4
      },
      {
        id: 'sample-hospital-008',
        name: `${c}口腔医院`,
        level: '专科',
        city: c,
        address: `${c}示例区皓齿路 19 号`,
        departments: ['外科', '急诊科'],
        coordinates: { lat: 39.9042, lng: 116.4374 },
        distance_km: 9.7
      },
      {
        id: 'sample-hospital-009',
        name: `${c}康复医院`,
        level: '二甲',
        city: c,
        address: `${c}示例区复健路 77 号`,
        departments: ['康复医学科', '疼痛科', '骨科'],
        coordinates: { lat: 39.8942, lng: 116.4274 },
        distance_km: 11.2
      },
      {
        id: 'sample-hospital-010',
        name: `${c}传染病医院`,
        level: '三乙',
        city: c,
        address: `${c}示例区防疫路 5 号`,
        departments: ['感染科', '肝病门诊', '急诊科'],
        coordinates: { lat: 39.9242, lng: 116.4174 },
        distance_km: 13.5
      }
    ]
  }, [city])

  const imageUrls = useMemo(() => {
    const seedBase = hospital?.id ?? hospitalId
    const seed = encodeURIComponent(seedBase)
    return [
      `https://picsum.photos/seed/${seed}-1/1200/800`,
      `https://picsum.photos/seed/${seed}-2/1200/800`,
      `https://picsum.photos/seed/${seed}-3/1200/800`
    ]
  }, [hospital?.id, hospitalId])

  const cardWidth = Math.max(280, windowWidth - theme.space[4] * 2)
  const cardHeight = Math.min(260, Math.max(180, Math.round(cardWidth * 0.56)))

  const about = useMemo(() => {
    if (!hospital) return ''
    const name = hospital.name.trim()
    const level = hospital.level ? `（${hospital.level}）` : ''
    const address = hospital.address?.trim()
    const dep = hospital.departments.slice(0, 8).join('、')

    const parts: string[] = []

    if (name.includes('第一人民医院')) {
      parts.push(`${name}${level}，位于${hospital.city}。`)
      if (address) parts.push(`地址：${address}。`)
      if (dep) parts.push(`常见就诊科室：${dep}。`)
      parts.push('建议提前线上预约挂号，按症状选择科室；如出现胸痛、呼吸困难、意识障碍等急症信号，请直接急诊就医。')
      parts.push('到院后可先在导诊台/自助机完成建卡与取号，按叫号顺序就诊；建议携带既往检查报告、用药清单与医保/身份证件。')
      return parts.join('\n')
    }

    if (name.includes('中心医院')) {
      parts.push(`作为${hospital.city}区域医疗中心，${name}集医疗、教学、科研为一体。${level}综合实力强劲。`)
      if (address) parts.push(`地址：${address}。`)
      if (dep) parts.push(`重点学科包括${dep}等，享有盛誉。`)
      parts.push('医院设有完善的急救绿色通道，全天候接诊急危重症患者。')
      parts.push('常规就诊建议通过官方APP或微信公众号提前1-7天预约，现场凭身份证或医保卡取号签到。院内设施现代化，提供一站式结算服务。')
      return parts.join('\n')
    }

    if (name.includes('中医院')) {
      parts.push(`${name}是一所具有鲜明中医特色的${level}医院，坚持中西医并重。位于${hospital.city}。`)
      if (address) parts.push(`地址：${address}。`)
      if (dep) parts.push(`特色科室：${dep}，擅长运用传统中医疗法结合现代医学技术治疗各类疑难杂症。`)
      parts.push('就诊提示：部分名老中医专家号源紧张，建议提前两周关注放号时间。')
      parts.push('医院提供代煎中药及配送服务，方便患者复诊取药。')
      return parts.join('\n')
    }

    if (name.includes('妇幼保健院')) {
      parts.push(`${name}专注妇女儿童健康，是${hospital.city}知名的${level}专科医院。`)
      if (address) parts.push(`地址：${address}。`)
      if (dep) parts.push(`重点科室：${dep}。`)
      parts.push('医院提供婚前检查、孕产期保健、分娩服务及儿童疾病诊治的全生命周期服务。')
      parts.push('温馨提示：产科建档需提前预约，儿科夜门诊及急诊全年无休。设有母婴室及儿童游乐区，为就诊家庭提供人性化环境。')
      return parts.join('\n')
    }

    if (name.includes('肿瘤医院')) {
      parts.push(`${name}是${hospital.city}权威的肿瘤专科诊治中心${level}。`)
      if (address) parts.push(`地址：${address}。`)
      if (dep) parts.push(`医院整合${dep}等多学科力量，开展肿瘤规范化、个体化综合治疗。`)
      parts.push('就医建议：初诊患者建议携带既往所有影像资料及病理报告。')
      parts.push('医院设有肿瘤多学科联合门诊（MDT），可为疑难病例提供一站式诊疗方案。支持异地医保联网结算。')
      return parts.join('\n')
    }

    if (name.includes('儿童医院')) {
      parts.push(`${name}致力于守护儿童健康，是${hospital.city}综合性${level}儿童专科医院。`)
      if (address) parts.push(`地址：${address}。`)
      if (dep) parts.push(`擅长治疗${dep}等各类儿童常见病及疑难重症。`)
      parts.push('家长须知：发热高峰期排队时间较长，建议通过互联网医院进行初筛或复诊。')
      parts.push('急诊按病情分级候诊，危重患儿优先。请携带患儿医保卡及接种证就诊。')
      return parts.join('\n')
    }

    if (name.includes('皮肤病医院')) {
      parts.push(`${name}是${hospital.city}乃至周边地区知名的皮肤病专科医院${level}。`)
      if (address) parts.push(`地址：${address}。`)
      if (dep) parts.push(`特色诊疗：${dep}，特别是在银屑病、白癜风及医学美容方面有丰富经验。`)
      parts.push('就诊指南：部分激光美容项目需预约治疗时间。')
      parts.push('医院开展周末门诊及午间门诊，满足不同人群就医需求。建议穿着宽松衣物以便检查。')
      return parts.join('\n')
    }

    if (name.includes('口腔医院')) {
      parts.push(`${name}集口腔医疗、预防、保健为一体，是${hospital.city}口腔医学中心${level}。`)
      if (address) parts.push(`地址：${address}。`)
      if (dep) parts.push(`优势学科：${dep}。拥有先进的数字化口腔诊疗设备，提供种植牙、正畸、牙周治疗等专业服务。`)
      parts.push('预约提示：洁牙、拔牙及正畸初诊建议提前预约。急牙痛患者可挂口腔急诊。')
      parts.push('儿童看牙设有专门的儿童口腔科及舒适化治疗中心。')
      return parts.join('\n')
    }

    if (name.includes('康复医院')) {
      parts.push(`${name}专注于康复医学，为${level}专业康复医疗机构。位于${hospital.city}。`)
      if (address) parts.push(`地址：${address}。`)
      if (dep) parts.push(`设有${dep}，主要服务对象为神经系统损伤、骨关节术后及老年慢性病患者。`)
      parts.push('服务特色：提供物理治疗（PT）、作业治疗（OT）、言语治疗（ST）等综合康复训练。')
      parts.push('拥有宽敞的康复大厅及各类康复机器人设备。支持住院康复及门诊康复治疗。')
      return parts.join('\n')
    }

    if (name.includes('传染病医院')) {
      parts.push(`${name}是${hospital.city}公共卫生医疗救治中心，${level}专科医院。`)
      if (address) parts.push(`地址：${address}。`)
      if (dep) parts.push(`设有${dep}，擅长各类感染性疾病及肝病的诊断与治疗。`)
      parts.push('特别提示：发热门诊及肠道门诊24小时开放。')
      parts.push('就诊请严格遵守院感防控规定，佩戴口罩，按指定路线通行。肝病门诊提供长期随访管理服务。')
      return parts.join('\n')
    }

    return `${name}${level}位于${hospital.city}，提供${dep || '多学科'}等医疗服务。`
  }, [hospital])

  const planButtonWidth = Math.min(320, Math.max(200, windowWidth - theme.space[4] * 2))
  const dayControlWidth = Math.max(56, Math.round(planButtonWidth * 0.1))
  const planMainWidth = Math.max(140, planButtonWidth - dayControlWidth - 10)

  const computedDays = useMemo(() => {
    const s = new Date(departureDate).getTime()
    const e = new Date(returnDate).getTime()
    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return 1
    return Math.max(1, Math.ceil((e - s) / (24 * 3600 * 1000)))
  }, [departureDate, returnDate])

  const compact = useMemo(() => {
    const fmt = (iso: string) => {
      const m = iso.slice(5, 7)
      const d = iso.slice(8, 10)
      if (!m || !d) return iso
      return `${m}/${d}`
    }
    return `${fmt(departureDate)}\n${fmt(returnDate)}`
  }, [departureDate, returnDate])

  const isoFromParts = (year: number, month: number, day: number) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${String(year)}-${pad(month + 1)}-${pad(day)}`
  }

  const addDays = (iso: string, delta: number) => {
    const t = new Date(iso).getTime()
    if (!Number.isFinite(t)) return iso
    return new Date(t + delta * 24 * 3600 * 1000).toISOString().slice(0, 10)
  }

  const getSafeDates = (dep: string, ret: string) => {
    const nowIso = new Date().toISOString().slice(0, 10)
    const depMs = new Date(dep).getTime()
    const depIso = Number.isFinite(depMs) ? dep.slice(0, 10) : nowIso

    const retMs0 = new Date(ret).getTime()
    let retIso = Number.isFinite(retMs0) ? ret.slice(0, 10) : addDays(depIso, 1)

    const depMs2 = new Date(depIso).getTime()
    const retMs2 = new Date(retIso).getTime()
    if (Number.isFinite(depMs2) && Number.isFinite(retMs2) && retMs2 <= depMs2) {
      retIso = addDays(depIso, 1)
    }

    return { departure: depIso, return: retIso }
  }

  const setDepartureDateSafe = (next: string) => {
    const safe = getSafeDates(next, returnDate)
    setDepartureDate(safe.departure)
    setReturnDate(safe.return)
  }

  const setReturnDateSafe = (next: string) => {
    const safe = getSafeDates(departureDate, next)
    setDepartureDate(safe.departure)
    setReturnDate(safe.return)
  }

  const openDatePicker = (target: 'departure' | 'return') => {
    const iso = target === 'departure' ? departureDate : returnDate
    const t = new Date(iso).getTime()
    const base = Number.isFinite(t) ? new Date(t) : new Date()
    setDatePickerYear(base.getFullYear())
    setDatePickerMonth(base.getMonth())
    setDatePickerTarget(target)
  }

  const datePickerCells = useMemo(() => {
    const firstDow = new Date(datePickerYear, datePickerMonth, 1).getDay()
    const daysInMonth = new Date(datePickerYear, datePickerMonth + 1, 0).getDate()
    const cells: Array<{ day: number | null; iso?: string }> = []
    for (let i = 0; i < firstDow; i += 1) cells.push({ day: null })
    for (let d = 1; d <= daysInMonth; d += 1) cells.push({ day: d, iso: isoFromParts(datePickerYear, datePickerMonth, d) })
    while (cells.length < 42) cells.push({ day: null })
    return cells
  }, [datePickerMonth, datePickerYear])

  const datePickerTitle = `${datePickerYear}年${datePickerMonth + 1}月`
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // 优先检查本地示例数据
      const localSample = sampleHospitalData.find(h => h.id === hospitalId)
      if (localSample) {
        setHospital(localSample)
        return
      }

      setLoading(true)
      try {
        const resp = await apiFetch<{ ok: true; hospital: Hospital }>(`/v1/hospitals/${hospitalId}`, { method: 'GET' })
        if (cancelled) return
        setHospital(resp.hospital)
      } catch (e: any) {
        if (cancelled) return
        Alert.alert('加载失败', e?.error ?? e?.message ?? '未知错误')
        setHospital(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hospitalId, sampleHospitalData])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
      <View style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={{ padding: theme.space[4], gap: theme.space[3], paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="title">{hospital?.name ?? '简介'}</Text>

          {loading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color={theme.color.primary} />
            </View>
          ) : null}

          {hospital ? (
            <View style={{ gap: theme.space[3] }}>
              <Card style={{ padding: 0, overflow: 'hidden' as any }}>
                <FlatList
                  data={imageUrls}
                  keyExtractor={(u) => u}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <Pressable
                      onPress={() => {
                        setViewerIndex(index)
                        setViewerOpen(true)
                      }}
                      style={{ width: cardWidth, height: cardHeight }}
                    >
                      <Image source={{ uri: item }} style={{ width: cardWidth, height: cardHeight }} resizeMode="cover" />
                    </Pressable>
                  )}
                />
              </Card>

              <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' }}>
                  <Pressable onPress={() => setViewerOpen(false)} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>关闭</Text>
                  </Pressable>

                  <FlatList
                    data={imageUrls}
                    keyExtractor={(u) => `viewer:${u}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={viewerIndex}
                    getItemLayout={(_, idx) => ({ length: windowWidth, offset: windowWidth * idx, index: idx })}
                    renderItem={({ item }) => (
                      <View style={{ width: windowWidth, height: windowHeight, justifyContent: 'center', alignItems: 'center' }}>
                        <ScrollView
                          maximumZoomScale={3}
                          minimumZoomScale={1}
                          contentContainerStyle={{ width: windowWidth, height: windowHeight, justifyContent: 'center', alignItems: 'center' }}
                        >
                          <Image source={{ uri: item }} style={{ width: windowWidth, height: windowHeight }} resizeMode="contain" />
                        </ScrollView>
                      </View>
                    )}
                  />
                </View>
              </Modal>

              <Card>
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: bodyUp, fontWeight: '700' }}>地址</Text>
                  <Text variant="caption">{hospital.address || '—'}</Text>
                </View>
              </Card>

              <Card>
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: bodyUp, fontWeight: '700' }}>简介</Text>
                  <Text style={{ fontSize: captionUp, color: theme.color.text }}>{about || '—'}</Text>
                </View>
              </Card>
            </View>
          ) : !loading ? (
            <Text variant="muted">暂无医院信息</Text>
          ) : null}
        </ScrollView>

        <Modal
          visible={datePickerTarget !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setDatePickerTarget(null)}
        >
          <Pressable
            onPress={() => setDatePickerTarget(null)}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', padding: theme.space[4], justifyContent: 'center' }}
          >
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: theme.space[4],
                gap: theme.space[3],
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.08)'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pressable
                  onPress={() => {
                    const prev = datePickerMonth - 1
                    if (prev >= 0) setDatePickerMonth(prev)
                    else {
                      setDatePickerYear((y) => y - 1)
                      setDatePickerMonth(11)
                    }
                  }}
                  style={{
                    height: 34,
                    width: 44,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#ddd'
                  }}
                >
                  <Text style={{ fontWeight: '700' }}>‹</Text>
                </Pressable>
                <Text style={{ fontSize: bodyUp, fontWeight: '700', color: theme.color.text }}>{datePickerTitle}</Text>
                <Pressable
                  onPress={() => {
                    const next = datePickerMonth + 1
                    if (next <= 11) setDatePickerMonth(next)
                    else {
                      setDatePickerYear((y) => y + 1)
                      setDatePickerMonth(0)
                    }
                  }}
                  style={{
                    height: 34,
                    width: 44,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#ddd'
                  }}
                >
                  <Text style={{ fontWeight: '700' }}>›</Text>
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
                  <Text key={w} style={{ width: `${100 / 7}%`, textAlign: 'center', color: theme.color.mutedForeground }}>
                    {w}
                  </Text>
                ))}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {datePickerCells.map((c, idx) => {
                  const iso = c.iso
                  const selected = iso ? (datePickerTarget === 'departure' ? iso === departureDate : iso === returnDate) : false
                  const isToday = iso === todayIso
                  return (
                    <Pressable
                      key={`${idx}:${iso ?? 'x'}`}
                      disabled={!iso}
                      onPress={() => {
                        if (!iso || !datePickerTarget) return
                        if (datePickerTarget === 'departure') setDepartureDateSafe(iso)
                        else setReturnDateSafe(iso)
                        setDatePickerTarget(null)
                      }}
                      style={{
                        width: `${100 / 7}%`,
                        paddingVertical: 6,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {iso ? (
                        <View
                          style={{
                            height: 34,
                            width: 34,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: selected ? theme.color.primary : 'transparent',
                            borderWidth: selected ? 0 : isToday ? 1 : 0,
                            borderColor: isToday ? theme.color.primary : 'transparent'
                          }}
                        >
                          <Text style={{ fontWeight: selected ? '700' : '600', color: selected ? '#fff' : theme.color.text }}>
                            {c.day}
                          </Text>
                        </View>
                      ) : (
                        <View style={{ height: 34, width: 34 }} />
                      )}
                    </Pressable>
                  )
                })}
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Button title="关闭" variant="outline" onPress={() => setDatePickerTarget(null)} />
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <View style={{ padding: theme.space[4], paddingTop: theme.space[2], alignItems: 'center' }}>
          <View style={{ width: planButtonWidth, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Button
                title={planning ? '规划中…' : '一键规划'}
                loading={planning}
                disabled={planning || !hospital}
                onPress={async () => {
                  if (!hospital) return
                  setPlanError(null)
                  const safe = getSafeDates(departureDate, returnDate)
                  if (safe.departure !== departureDate) setDepartureDate(safe.departure)
                  if (safe.return !== returnDate) setReturnDate(safe.return)
                  const departure_date = safe.departure
                  const return_date = safe.return
                  const departure_address = `${(city || hospital.city || '').trim() || '本地'}市中心`

                  setPlanning(true)
                  try {
                    const resp = await apiFetch<{ ok: true; itinerary_id: string; plan: ItineraryPlan }>('/v1/itineraries/plan', {
                      method: 'POST',
                      body: JSON.stringify({
                        hospital_id: hospital.id,
                        departure_address,
                        budget_level: 'mid',
                        departure_date,
                        return_date,
                        city: hospital.city
                      })
                    })
                    navigation.navigate('PlanResult', {
                      itineraryId: resp.itinerary_id,
                      plan: resp.plan,
                      departureDate: departure_date,
                      returnDate: return_date,
                      hospitalId: hospital.id,
                      hospitalName: hospital.name
                    })
                  } catch (e: any) {
                    const code = String(e?.error ?? '')
                    const msg = String(e?.message ?? '')
                    if (code === 'UNAUTHORIZED') {
                      const text = '登录已过期，请重新登录后再试'
                      if (Platform.OS === 'web' && typeof (globalThis as any).alert === 'function') {
                        ;(globalThis as any).alert(text)
                      } else {
                        Alert.alert('登录已过期', '请重新登录后再试')
                      }
                      await setToken(null)
                      return
                    }
                    const text =
                      code === 'LOCATION_CONSENT_REQUIRED'
                          ? '需要开启定位授权后才能规划'
                          : code === 'SENSITIVE_CONSENT_REQUIRED'
                            ? '需要开启敏感信息授权后才能规划'
                            : code === 'NETWORK_ERROR'
                              ? `无法连接后端服务：${msg || 'NETWORK_ERROR'}`
                              : code === 'TIMEOUT'
                                ? `请求超时：${msg || 'TIMEOUT'}`
                                : msg || code || '未知错误'
                    setPlanError(text)
                    if (Platform.OS === 'web' && typeof (globalThis as any).alert === 'function') {
                      ;(globalThis as any).alert(`规划失败：${text}`)
                    } else {
                      Alert.alert('规划失败', text)
                    }
                  } finally {
                    setPlanning(false)
                  }
                }}
                style={{ width: planMainWidth }}
              />
              <Pressable
                disabled={planning}
                onPress={() => setDateOpen((v) => !v)}
                style={{
                  height: 44,
                  width: dayControlWidth,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#ddd'
                }}
              >
                <Text style={{ fontWeight: '700', color: theme.color.text, fontSize: 11, textAlign: 'center', lineHeight: 13 }}>
                  {compact}
                </Text>
              </Pressable>
            </View>

            {dateOpen ? (
              <View style={{ marginTop: 10, width: planButtonWidth }}>
                <Card>
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <Text style={{ fontWeight: '700', color: theme.color.text }}>出发</Text>
                      <Pressable
                        onPress={() => openDatePicker('departure')}
                        style={{
                          height: 32,
                          paddingHorizontal: 10,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: '#ddd',
                          backgroundColor: 'rgba(255,255,255,0.85)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 140
                        }}
                      >
                        <Text style={{ color: theme.color.text, fontWeight: '700' }}>{departureDate}</Text>
                      </Pressable>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <Text style={{ fontWeight: '700', color: theme.color.text }}>返回</Text>
                      <Pressable
                        onPress={() => openDatePicker('return')}
                        style={{
                          height: 32,
                          paddingHorizontal: 10,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: '#ddd',
                          backgroundColor: 'rgba(255,255,255,0.85)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 140
                        }}
                      >
                        <Text style={{ color: theme.color.text, fontWeight: '700' }}>{returnDate}</Text>
                      </Pressable>
                    </View>

                    <Text style={{ color: theme.color.mutedForeground }}>{`共${computedDays}天`}</Text>
                  </View>
                </Card>
              </View>
            ) : null}
          </View>
          {planError ? (
            <Text style={{ marginTop: 10, color: theme.color.destructive, textAlign: 'center', maxWidth: planButtonWidth }}>
              {planError}
            </Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  )
}
