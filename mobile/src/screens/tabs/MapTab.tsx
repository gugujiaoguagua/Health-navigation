import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Platform, SafeAreaView, View } from 'react-native'
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps'
import * as Location from 'expo-location'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { apiFetch } from '../../api/client'
import { useAppUI } from '../../state/AppUIContext'
import type { Hospital } from '../../types/api'
import type { AppStackParamList } from '../navTypes'
import { Button } from '../../ui/components/Button'
import { Card } from '../../ui/components/Card'
import { Text } from '../../ui/components/Text'
import { theme } from '../../ui/theme'

type Coord = { latitude: number; longitude: number }

type RouteMode = 'drive' | 'walk'

type RouteSummary = {
  distance_m: number
  duration_s: number
  coordinates: Coord[]
}

function defaultCenter(city: string): Coord {
  // MVP：只做一个稳定默认值，避免没有定位/没有医院时白屏。
  // 后续可以引入城市中心点表，或后端返回 city 的 bbox/center。
  if (city.includes('上海')) return { latitude: 31.2304, longitude: 121.4737 }
  if (city.includes('北京')) return { latitude: 39.9042, longitude: 116.4074 }
  if (city.includes('广州')) return { latitude: 23.1291, longitude: 113.2644 }
  if (city.includes('深圳')) return { latitude: 22.5431, longitude: 114.0579 }
  return { latitude: 31.2304, longitude: 121.4737 }
}

function formatDistance(m: number) {
  if (!Number.isFinite(m) || m <= 0) return '-'
  if (m < 1000) return `${Math.round(m)}m`
  return `${(m / 1000).toFixed(1)}km`
}

function formatDuration(s: number) {
  if (!Number.isFinite(s) || s <= 0) return '-'
  const min = Math.round(s / 60)
  if (min < 60) return `${min}分钟`
  const h = Math.floor(min / 60)
  const rest = min % 60
  return `${h}小时${rest ? `${rest}分钟` : ''}`
}

async function getCurrentLocation(): Promise<Coord | null> {
  const perm = await Location.requestForegroundPermissionsAsync()
  if (perm.status !== 'granted') return null
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
}

async function fetchOsrmRoute(input: { from: Coord; to: Coord; mode: RouteMode }): Promise<RouteSummary> {
  // 改为后端代理：前端不直连 OSRM，便于你们后续自建/替换/缓存。
  const path = input.mode === 'walk' ? '/v1/routes/walk' : '/v1/routes/drive'

  const resp = await apiFetch<{ ok: true; route: { distance_m: number; duration_s: number; coordinates: Array<{ lat: number; lng: number }> } }>(
    path,
    {
      method: 'POST',
      body: JSON.stringify({
        from: { lat: input.from.latitude, lng: input.from.longitude },
        to: { lat: input.to.latitude, lng: input.to.longitude }
      })
    }
  )

  const coordinates: Coord[] = resp.route.coordinates
    .map((p) => ({ latitude: Number(p.lat), longitude: Number(p.lng) }))
    .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))

  return {
    distance_m: Number(resp.route.distance_m ?? 0) || 0,
    duration_s: Number(resp.route.duration_s ?? 0) || 0,
    coordinates
  }
}


export function MapTab() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const { state } = useAppUI()

  const mapRef = useRef<MapView | null>(null)

  const [loadingHospitals, setLoadingHospitals] = useState(false)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [locating, setLocating] = useState(false)
  const [myLocation, setMyLocation] = useState<Coord | null>(null)

  const [routing, setRouting] = useState(false)
  const [routeMode, setRouteMode] = useState<RouteMode>('drive')
  const [route, setRoute] = useState<RouteSummary | null>(null)

  const selected = useMemo(() => hospitals.find((h) => h.id === selectedId) ?? null, [hospitals, selectedId])

  const center = useMemo(() => {
    if (myLocation) return myLocation
    if (selected?.coordinates) return { latitude: selected.coordinates.lat, longitude: selected.coordinates.lng }
    if (hospitals[0]?.coordinates) return { latitude: hospitals[0].coordinates.lat, longitude: hospitals[0].coordinates.lng }
    return defaultCenter(state.city)
  }, [hospitals, myLocation, selected?.coordinates, state.city])

  const tileTemplate = useMemo(() => {
    // 默认 OSM（开发方便）。上线建议换成你们自建瓦片：
    // 例如：EXPO_PUBLIC_TILE_URL_TEMPLATE=https://tiles.example.com/{z}/{x}/{y}.png
    return process.env.EXPO_PUBLIC_TILE_URL_TEMPLATE ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  }, [])

  async function loadHospitals() {
    const city = state.city.trim()
    if (!city) {
      setHospitals([])
      return
    }

    setLoadingHospitals(true)
    try {
      // 地图页默认只按城市拉取；筛选/科室联动可以后续接。
      const resp = await apiFetch<{ ok: true; data: Hospital[]; total: number }>(
        `/v1/hospitals?city=${encodeURIComponent(city)}&page=1&page_size=100`,
        { method: 'GET' }
      )
      setHospitals(resp.data)
      // 默认选中推荐列表第一项（如果有）
      const pick = resp.data[0]?.id ?? null
      setSelectedId((prev) => prev ?? pick)
    } catch (e: any) {
      setHospitals([])
      Alert.alert('加载医院失败', e?.error ?? e?.message ?? '未知错误')
    } finally {
      setLoadingHospitals(false)
    }
  }

  async function locateMe() {
    setLocating(true)
    try {
      const pos = await getCurrentLocation()
      if (!pos) {
        Alert.alert('无法定位', '请在系统设置中授予定位权限')
        return
      }
      setMyLocation(pos)
      mapRef.current?.animateToRegion(
        {
          latitude: pos.latitude,
          longitude: pos.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03
        },
        250
      )
    } catch (e: any) {
      Alert.alert('定位失败', e?.message ?? '未知错误')
    } finally {
      setLocating(false)
    }
  }

  async function buildRoute() {
    if (!myLocation) {
      Alert.alert('请先定位', '需要获取你的当前位置才能规划路线')
      return
    }
    if (!selected?.coordinates) {
      Alert.alert('请选择医院', '请选择一个医院点位')
      return
    }

    setRouting(true)
    try {
      const to = { latitude: selected.coordinates.lat, longitude: selected.coordinates.lng }
      const r = await fetchOsrmRoute({ from: myLocation, to, mode: routeMode })
      setRoute(r)

      if (r.coordinates.length) {
        mapRef.current?.fitToCoordinates(r.coordinates, {
          edgePadding: { top: 80, right: 60, bottom: 240, left: 60 },
          animated: true
        })
      }
    } catch (e: any) {
      setRoute(null)
      Alert.alert('路线规划失败', e?.message ?? '未知错误')
    } finally {
      setRouting(false)
    }
  }

  useEffect(() => {
    void loadHospitals()
    // 进入地图页时就尝试定位（用户可以拒绝）
    void locateMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.city])

  useEffect(() => {
    // 切换出行方式时，若已有路线则自动重算
    if (!route) return
    void buildRoute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeMode])

  if (Platform.OS === 'web') {
    // Web 端用 OSM 官方 embed 先跑通“可预览地图”。
    // 优点：0 依赖；后续要更强能力（自建瓦片/marker/路线渲染）再换 MapLibre/Leaflet。
    const c = center
    const zoom = 12

    // 经验公式：lonSpan≈360/2^zoom, latSpan≈170/2^zoom（粗略；足够用于 embed bbox）
    const lonSpan = 360 / Math.pow(2, zoom)
    const latSpan = 170 / Math.pow(2, zoom)

    const west = c.longitude - lonSpan / 2
    const east = c.longitude + lonSpan / 2
    const south = c.latitude - latSpan / 2
    const north = c.latitude + latSpan / 2

    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik&marker=${c.latitude}%2C${c.longitude}`

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
        <View style={{ flex: 1, padding: theme.space[4], gap: theme.space[3] }}>
          <Text variant="title">地图</Text>

          <Card>
            <Text variant="caption" style={{ color: theme.color.mutedForeground }}>
              Web 预览使用 OpenStreetMap embed（开发期）。移动端仍使用原生地图组件。
            </Text>
          </Card>

          <View style={{ flex: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }}>
            {/* eslint-disable-next-line jsx-a11y/iframe-has-title */}
            <iframe src={src} style={{ width: '100%', height: '100%', border: 0 }} />
          </View>
        </View>
      </SafeAreaView>
    )
  }


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
      <View style={{ flex: 1 }}>
        <View style={{ padding: theme.space[4], gap: theme.space[2] }}>
          <Text variant="title">地图</Text>

          <Card>
            <View style={{ gap: theme.space[2] }}>
              <Text variant="caption">城市：{state.city || '-'}</Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] }}>
                <Button title={locating ? '定位中…' : '定位'} variant="outline" onPress={() => void locateMe()} disabled={locating} />
                <Button
                  title={loadingHospitals ? '加载医院…' : '刷新医院'}
                  variant="outline"
                  onPress={() => void loadHospitals()}
                  disabled={loadingHospitals}
                />
                <Button
                  title={routing ? '规划中…' : '规划路线'}
                  variant="primary"
                  onPress={() => void buildRoute()}
                  disabled={routing || !selectedId}
                />
                <Button title="清除路线" variant="secondary" onPress={() => setRoute(null)} />
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2], alignItems: 'center' }}>
                <Text variant="caption">方式：</Text>
                <Button
                  title="驾车"
                  variant={routeMode === 'drive' ? 'primary' : 'outline'}
                  onPress={() => setRouteMode('drive')}
                />
                <Button
                  title="步行"
                  variant={routeMode === 'walk' ? 'primary' : 'outline'}
                  onPress={() => setRouteMode('walk')}
                />
                <Text variant="caption" style={{ color: theme.color.mutedForeground }}>
                  公交/地铁/高铁/飞机：下一阶段接入（需要交通数据源）
                </Text>
              </View>

              {selected ? (
                <View style={{ gap: 4 }}>
                  <Text style={{ fontWeight: '700' }}>已选：{selected.name}</Text>
                  <Text variant="caption">{selected.address}</Text>
                </View>
              ) : (
                <Text variant="caption" style={{ color: theme.color.mutedForeground }}>
                  点击地图上的医院标记进行选择。
                </Text>
              )}

              {route ? (
                <Text variant="caption">
                  路线：{formatDistance(route.distance_m)} · {formatDuration(route.duration_s)}
                </Text>
              ) : null}

              {selected ? (
                <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="去生成行程"
                      variant="outline"
                      onPress={() => navigation.navigate('Plan', { hospitalId: selected.id, city: state.city })}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          </Card>
        </View>

        <View style={{ flex: 1 }}>
          <MapView
            ref={(r) => {
              mapRef.current = r
            }}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: center.latitude,
              longitude: center.longitude,
              latitudeDelta: 0.06,
              longitudeDelta: 0.06
            }}
          >
            {/* 底图瓦片：默认 OSM；可通过 EXPO_PUBLIC_TILE_URL_TEMPLATE 替换为自建瓦片 */}
            <UrlTile urlTemplate={tileTemplate} maximumZ={19} flipY={false} />

            {myLocation ? (
              <Marker
                identifier="me"
                coordinate={myLocation}
                title="我的位置"
                pinColor={theme.color.primary}
              />
            ) : null}

            {hospitals
              .filter((h) => Number.isFinite(h.coordinates?.lat) && Number.isFinite(h.coordinates?.lng))
              .map((h) => {
                const active = h.id === selectedId
                return (
                  <Marker
                    key={h.id}
                    identifier={h.id}
                    coordinate={{ latitude: h.coordinates.lat, longitude: h.coordinates.lng }}
                    title={h.name}
                    description={h.address}
                    pinColor={active ? theme.color.primary : undefined}
                    onPress={() => {
                      setSelectedId(h.id)
                    }}
                  />
                )
              })}

            {route?.coordinates?.length ? (
              <Polyline
                coordinates={route.coordinates}
                strokeWidth={5}
                strokeColor={theme.color.primary}
              />
            ) : null}
          </MapView>
        </View>
      </View>
    </SafeAreaView>
  )
}
