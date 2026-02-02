import React, { useEffect, useState } from 'react'
import { Alert, ActivityIndicator, SafeAreaView } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../api/client'
import { AppUIProvider } from '../state/AppUIContext'
import type { Consent } from '../types/api'
import { theme } from '../ui/theme'
import { ConsentScreen } from './ConsentScreen'
import { AgreementScreen } from './AgreementScreen'
import { HospitalListScreen } from './HospitalListScreen'
import { ChecklistScreen } from './ChecklistScreen'
import { ItineraryAccommodationEditScreen } from './ItineraryAccommodationEditScreen'
import { ItineraryDetailScreen } from './ItineraryDetailScreen'
import { LoginScreen } from './LoginScreen'
import { PlanResultScreen } from './PlanResultScreen'
import { PlanScreen } from './PlanScreen'
import { ProfileEditScreen } from './ProfileEditScreen'
import { SettingsScreen } from './SettingsScreen'
import { AboutScreen } from './AboutScreen'
import { HealthRecordScreen } from './HealthRecordScreen'
import { SymptomScreen } from './SymptomScreen'
import { TabsScreen } from './TabsScreen'
import type { AppStackParamList } from './navTypes'

const Stack = createNativeStackNavigator<AppStackParamList>()

export function RootNavigator() {
  const { token, ready, setToken } = useAuth()
  const [consent, setConsent] = useState<Consent | null>(null)
  const [loadingConsent, setLoadingConsent] = useState(false)

  useEffect(() => {
    if (!token) {
      setConsent(null)
      return
    }
    ;(async () => {
      setLoadingConsent(true)
      try {
        const resp = await apiFetch<{ ok: true; consent: Consent }>('/v1/consents', { method: 'GET' })
        setConsent(resp.consent)
      } catch (e: any) {
        if (String(e?.error ?? '') === 'UNAUTHORIZED') {
          Alert.alert('登录已过期', '请重新登录后再试')
          await setToken(null)
          return
        }
        Alert.alert('加载授权失败', e?.error ?? '未知错误')
      } finally {
        setLoadingConsent(false)
      }
    })()
  }, [token])

  if (!ready || loadingConsent) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </SafeAreaView>
    )
  }

  if (!token) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    )
  }

  const needsConsent = !consent?.sensitiveAccepted || !consent?.locationAccepted

  if (needsConsent) {
    return (
      <NavigationContainer>
        <AppUIProvider>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: theme.color.secondary },
              headerShadowVisible: false,
              headerTintColor: theme.color.text,
              headerTitleStyle: { color: theme.color.text, fontWeight: '700' }
            }}
          >
            <Stack.Screen name="Consent" options={{ title: '授权' }}>
              {(props) => <ConsentScreen {...props} onConsentUpdated={setConsent} />}
            </Stack.Screen>
          </Stack.Navigator>
        </AppUIProvider>
      </NavigationContainer>
    )
  }

  return (
    <NavigationContainer>
      <AppUIProvider>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.color.secondary },
            headerShadowVisible: false,
            headerTintColor: theme.color.text,
            headerTitleStyle: { color: theme.color.text, fontWeight: '700' }
          }}
        >
          <Stack.Screen name="Tabs" component={TabsScreen} options={{ headerShown: false }} />

          {/* Legacy screens (kept; can be removed after migration) */}
          <Stack.Screen name="Symptom" component={SymptomScreen} options={{ title: '症状描述' }} />
          <Stack.Screen name="HospitalList" component={HospitalListScreen} options={{ title: '推荐医院' }} />

          <Stack.Screen name="Plan" component={PlanScreen} options={{ title: '简介' }} />
          <Stack.Screen name="PlanResult" component={PlanResultScreen} options={{ title: '行程结果' }} />
          <Stack.Screen name="Checklist" component={ChecklistScreen} options={{ title: '行程清单' }} />
          <Stack.Screen name="ItineraryDetail" component={ItineraryDetailScreen} options={{ title: '行程详情' }} />
          <Stack.Screen name="ItineraryAccommodationEdit" component={ItineraryAccommodationEditScreen} options={{ title: '修改住宿' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '设置' }} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ title: '个人信息' }} />
          <Stack.Screen name="HealthRecord" component={HealthRecordScreen} options={{ title: '健康档案' }} />
          <Stack.Screen name="Agreement" component={AgreementScreen} options={{ title: '协议与公告' }} />
          <Stack.Screen name="About" component={AboutScreen} options={{ title: '关于' }} />
        </Stack.Navigator>
      </AppUIProvider>
    </NavigationContainer>
  )
}
