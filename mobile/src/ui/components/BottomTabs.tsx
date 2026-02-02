import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Image, Platform, Pressable, useWindowDimensions, View } from 'react-native'
import type { ImageSourcePropType } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { theme } from '../theme'
import { Text } from './Text'

export type TabKey = 'assistant' | 'hospitals' | 'map' | 'surroundings' | 'profile'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'assistant', label: '助手' },
  { key: 'hospitals', label: '医院' },
  { key: 'map', label: '地图' },
  { key: 'surroundings', label: '行程' },
  { key: 'profile', label: '我的' }
]

const MENU_PADDING = 8
const ITEM_H = 50
const ITEM_RADIUS = 12
const GAP = 8

// 贴底底栏（非“悬浮气泡”）的内边距
const BAR_PADDING_H = 16
const BAR_PADDING_TOP = 8
const BAR_PADDING_BOTTOM = 8

const tabIconSources: Record<TabKey, ImageSourcePropType> = {
  assistant: require('../../../assets/tab-icons/对话框01.png'),
  hospitals: require('../../../assets/tab-icons/医院01.png'),
  map: require('../../../assets/tab-icons/地图01.png'),
  // 需求：周边对应“计划”
  surroundings: require('../../../assets/tab-icons/计划01.png'),
  // 需求：我的对应“个人中心”
  profile: require('../../../assets/tab-icons/个人中心01.png')
}



function getItemWidths(menuWidth: number, count: number) {
  // 目标来自 Uiverse：collapsed≈70, expanded≈130。
  // 但 5 个 tab 同时存在，需按屏幕宽度自适配，避免溢出。
  const inner = Math.max(0, menuWidth - MENU_PADDING * 2)
  const availableForItems = Math.max(0, inner - GAP * (count - 1))

  // 如果屏幕很窄，直接均分，不强求展开差值。
  const baseline = availableForItems / count
  const minCollapsed = Math.min(56, baseline)
  const maxDelta = Math.max(0, availableForItems - minCollapsed * count)
  const delta = Math.min(60, maxDelta)

  const collapsed = (availableForItems - delta) / count
  const expanded = collapsed + delta

  return {
    collapsed: Math.max(44, collapsed),
    expanded: Math.max(44, expanded)
  }
}

function TabIcon({ name, active }: { name: TabKey; active: boolean }) {
  const source = tabIconSources[name]

  // 图标放大 10%
  const size = 24 * 1.1

  return <Image source={source} resizeMode="contain" style={{ width: size, height: size, opacity: active ? 1 : 0.6 }} />
}


function TabItem({
  tab,
  active,
  expanded,
  widths,
  onPress,
  onHoverIn,
  onHoverOut
}: {
  tab: { key: TabKey; label: string }
  active: boolean
  expanded: boolean
  widths: { collapsed: number; expanded: number }
  onPress: () => void
  onHoverIn: () => void
  onHoverOut: () => void
}) {
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false
    }).start()
  }, [expanded, progress])

  const color = active ? theme.color.primary : theme.color.mutedForeground

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [widths.collapsed, widths.expanded]
  })

  const highlightTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [widths.expanded, 0]
  })

  const titleOpacity = progress
  const titleTranslateX = progress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] })

  return (
    <Animated.View
      style={{
        width,
        height: ITEM_H,
        borderRadius: ITEM_RADIUS,
        overflow: 'hidden'
      }}
    >
      <Pressable
        onPress={onPress}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={({ pressed }) => [
          {
            flex: 1,
            borderRadius: ITEM_RADIUS,
            justifyContent: 'center'
          },
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
        ]}
      >
        {/* Uiverse 的 :before 高亮底，从右侧滑入 */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#eee',
            borderRadius: ITEM_RADIUS,
            transform: [{ translateX: highlightTranslateX }]
          }}
        />

        {/* Icon（固定在左侧） */}
        <View style={{ position: 'absolute', left: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}>
          <TabIcon name={tab.key} active={active} />
        </View>


        {/* Title（从右侧滑入） */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateX: titleTranslateX }],
            paddingLeft: 44,
            paddingRight: 12
          }}
        >
          <Text
            style={{
              color,
              fontWeight: '700',
              fontSize: 14,
              letterSpacing: 0.3,
              textAlign: 'center'
            }}
            numberOfLines={1}
          >
            {tab.label}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}

export function BottomTabs({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  const [hovered, setHovered] = useState<TabKey | null>(null)
  const insets = useSafeAreaInsets()
  const { width: windowWidth } = useWindowDimensions()

  // 底栏全宽贴底：宽度计算用“可用内容宽”，避免 item 动画把布局挤爆。
  const availableWidth = Math.max(0, windowWidth - BAR_PADDING_H * 2)
  const widths = useMemo(() => getItemWidths(availableWidth, tabs.length), [availableWidth])

  return (
    <View
      style={{
        backgroundColor: theme.color.background,
        borderTopWidth: 1,
        borderTopColor: theme.color.border,
        paddingTop: BAR_PADDING_TOP,
        paddingBottom: BAR_PADDING_BOTTOM + insets.bottom
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: BAR_PADDING_H,
          paddingVertical: MENU_PADDING
        }}
      >
        {tabs.map((t, idx) => {
          const isActive = t.key === active
          const isHovered = Platform.OS === 'web' && hovered === t.key
          const isExpanded = isActive || isHovered

          return (
            <View key={t.key} style={{ marginRight: idx === tabs.length - 1 ? 0 : GAP }}>
              <TabItem
                tab={t}
                active={isActive}
                expanded={isExpanded}
                widths={widths}
                onPress={() => onChange(t.key)}
                onHoverIn={() => setHovered(t.key)}
                onHoverOut={() => setHovered(null)}
              />
            </View>
          )
        })}
      </View>
    </View>
  )
}










