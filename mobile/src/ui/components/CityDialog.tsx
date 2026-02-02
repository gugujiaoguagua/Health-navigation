import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'

import { theme } from '../theme'
import { Button } from './Button'
import { Card } from './Card'
import { SearchBar } from './SearchBar'
import { Text } from './Text'

const DEFAULT_CITIES_CN = ['北京', '上海', '广州', '深圳', '杭州', '南京', '苏州', '成都', '重庆', '武汉', '西安', '长沙', '郑州', '青岛', '厦门']

const DEFAULT_CITY_MAP: Record<string, string[]> = {
  中国: DEFAULT_CITIES_CN,
  美国: ['纽约', '洛杉矶', '旧金山', '西雅图', '芝加哥', '波士顿', '华盛顿', '休斯顿'],
  法国: ['巴黎', '里昂', '马赛', '里尔', '图卢兹', '尼斯', '波尔多']
}

function guessCountryByCity(city: string, cityMap: Record<string, string[]>) {
  const c = city.trim()
  if (!c) return null
  for (const country of Object.keys(cityMap)) {
    if (cityMap[country]?.includes(c)) return country
  }
  return null
}

export function CityDialog({
  visible,
  value,
  onClose,
  onSelect,
  countries = ['中国', '美国', '法国'],
  cityMap = DEFAULT_CITY_MAP
}: {
  visible: boolean
  value: string
  onClose: () => void
  onSelect: (city: string) => void
  countries?: string[]
  cityMap?: Record<string, string[]>
}) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [q, setQ] = useState('')

  // 每次打开都从“先选国家”开始（按需求）
  useEffect(() => {
    if (!visible) return
    setSelectedCountry(null)
    setQ('')
  }, [visible])

  const currentCountry = useMemo(() => {
    return guessCountryByCity(value, cityMap)
  }, [cityMap, value])

  const cities = useMemo(() => {
    if (!selectedCountry) return []
    return cityMap[selectedCountry] ?? []
  }, [cityMap, selectedCountry])

  const filteredCities = useMemo(() => {
    const keyword = q.trim()
    const base = cities
    if (!keyword) return base
    return base.filter((c) => c.includes(keyword))
  }, [cities, q])

  const inCityStep = Boolean(selectedCountry)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        onClose()
      }}
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
            <Text variant="h2">{inCityStep ? '选择城市' : '选择国家'}</Text>
            <Text variant="caption">
              当前：{value || '未设置'}
              {currentCountry ? `（可能在：${currentCountry}）` : ''}
            </Text>
          </View>

          {inCityStep ? (
            <View style={{ gap: theme.space[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700' }}>国家：{selectedCountry}</Text>
                <Pressable
                  onPress={() => {
                    setSelectedCountry(null)
                    setQ('')
                  }}
                  style={({ pressed }) => [
                    { paddingVertical: 6, paddingHorizontal: 10, borderRadius: theme.radius.full, backgroundColor: theme.color.muted },
                    pressed ? { opacity: 0.85 } : null
                  ]}
                >
                  <Text variant="caption" style={{ color: theme.color.text, fontWeight: '700' }}>
                    重新选国家
                  </Text>
                </Pressable>
              </View>

              <SearchBar value={q} onChangeText={setQ} placeholder="搜索城市" onClear={() => setQ('')} />

              <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false}>
                {filteredCities.map((c) => {
                  const active = c === value
                  return (
                    <Pressable
                      key={c}
                      onPress={() => {
                        onSelect(c)
                        onClose()
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
                      <Text style={{ color: active ? theme.color.primary : theme.color.text, fontWeight: '600' }}>{c}</Text>
                    </Pressable>
                  )
                })}

                {!filteredCities.length ? <Text variant="caption">暂无匹配城市</Text> : null}
              </ScrollView>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false}>
              {countries.map((country) => {
                return (
                  <Pressable
                    key={country}
                    onPress={() => {
                      setSelectedCountry(country)
                      setQ('')
                    }}
                    style={({ pressed }) => [
                      {
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: theme.radius.lg,
                        backgroundColor: theme.color.background,
                        borderWidth: 1,
                        borderColor: theme.color.border
                      },
                      pressed ? { opacity: 0.85 } : null
                    ]}
                  >
                    <Text style={{ fontWeight: '700' }}>{country}</Text>
                    <Text variant="caption">点击查看该国家城市列表</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          )}

          <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
            <View style={{ flex: 1 }}>
              <Button
                title="关闭"
                variant="outline"
                onPress={() => {
                  onClose()
                }}
              />
            </View>

            {inCityStep ? (
              <View style={{ flex: 1 }}>
                <Button
                  title="用默认城市"
                  variant="secondary"
                  onPress={() => {
                    const fallback = (cityMap[selectedCountry!] ?? [])[0] ?? DEFAULT_CITIES_CN[0] ?? '上海'
                    onSelect(fallback)
                    onClose()
                  }}
                />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <Button
                  title="默认选中国"
                  variant="secondary"
                  onPress={() => {
                    setSelectedCountry('中国')
                    setQ('')
                  }}
                />
              </View>
            )}
          </View>
        </Card>
      </View>
    </Modal>
  )
}

