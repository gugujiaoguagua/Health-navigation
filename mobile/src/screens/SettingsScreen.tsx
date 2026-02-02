import React from 'react'
import { Alert, Button, SafeAreaView, Text, View } from 'react-native'

import { useAuth } from '../auth/AuthContext'
import { getApiBaseUrl } from '../api/client'

export function SettingsScreen() {
  const { setToken } = useAuth()
  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>设置</Text>
      <Text style={{ color: '#444' }}>API：{getApiBaseUrl()}</Text>
      <View style={{ height: 8 }} />
      <Button
        title="退出登录"
        onPress={() => {
          Alert.alert('确认退出', '将清除本地Token', [
            { text: '取消', style: 'cancel' },
            {
              text: '退出',
              style: 'destructive',
              onPress: async () => {
                await setToken(null)
              }
            }
          ])
        }}
      />
    </SafeAreaView>
  )
}

