import React, { useState } from 'react'
import { SafeAreaView, View, Image, Alert, ActivityIndicator } from 'react-native'
import Constants from 'expo-constants'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { theme } from '../ui/theme'
import { Button } from '../ui/components/Button'
import { Card } from '../ui/components/Card'
import { Text } from '../ui/components/Text'
import type { AppStackParamList } from './navTypes'

type Props = NativeStackScreenProps<AppStackParamList, 'About'>

export function AboutScreen({ navigation }: Props) {
  const [checking, setChecking] = useState(false)
  const version = Constants.expoConfig?.version || '1.0.0'

  const handleCheckUpdate = () => {
    setChecking(true)
    // 模拟检查更新请求
    setTimeout(() => {
      setChecking(false)
      Alert.alert('检查更新', '当前已是最新版本')
    }, 1500)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
      <View style={{ flex: 1, padding: theme.space[4], alignItems: 'center', gap: theme.space[6] }}>
        <View style={{ alignItems: 'center', marginTop: 40, gap: theme.space[3] }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              backgroundColor: theme.color.primary,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8
            }}
          >
            <Text style={{ color: '#fff', fontSize: 40, fontWeight: '800' }}>H</Text>
          </View>
          <Text variant="h2">健康导航</Text>
          <Text variant="caption">Version {version}</Text>
        </View>

        <Card style={{ width: '100%' }}>
          <View style={{ gap: theme.space[4] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '600' }}>软件版本</Text>
              <Text variant="caption">{version}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.05)' }} />
            <Button
              title={checking ? '检查中...' : '检查更新'}
              onPress={handleCheckUpdate}
              disabled={checking}
              loading={checking}
              variant="outline"
            />
          </View>
        </Card>

        <View style={{ flex: 1 }} />
        
        <Text variant="caption" style={{ textAlign: 'center', opacity: 0.5 }}>
          © 2026 健康导航 版权所有
        </Text>
      </View>
    </SafeAreaView>
  )
}
