import React, { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { BottomTabs, type TabKey } from '../ui/components/BottomTabs'
import type { AppStackParamList } from './navTypes'
import { AssistantTab } from './tabs/AssistantTab'
import { HospitalsTab } from './tabs/HospitalsTab'
import { MapTab } from './tabs/MapTab'
import { ProfileTab } from './tabs/ProfileTab'
import { SurroundingsTab } from './tabs/SurroundingsTab'

type Props = NativeStackScreenProps<AppStackParamList, 'Tabs'>

export function TabsScreen({ navigation, route }: Props) {
  const [active, setActive] = useState<TabKey>('assistant')

  useEffect(() => {
    const initialTab = route.params?.initialTab
    if (initialTab) {
      setActive(initialTab)
      navigation.setParams({ initialTab: undefined })
    }
  }, [navigation, route.params?.initialTab])

  const content = useMemo(() => {
    switch (active) {
      case 'assistant':
        return <AssistantTab onJumpTab={setActive} />
      case 'hospitals':
        return (
          <HospitalsTab
            onOpenPlan={(hospitalId, city) => navigation.navigate('Plan', { hospitalId, city })}
          />
        )
      case 'map':
        return <MapTab />
      case 'surroundings':
        return <SurroundingsTab />
      case 'profile':
        return (
          <ProfileTab
            onOpenAgreement={() => navigation.navigate('Agreement')}
            onOpenAbout={() => navigation.navigate('About')}
            onOpenHealthRecord={() => navigation.navigate('HealthRecord')}
            onOpenProfileEdit={() => navigation.navigate('ProfileEdit')}
            onOpenItinerary={(itineraryId) => navigation.navigate('ItineraryDetail', { itineraryId })}
          />
        )
      default:
        return <AssistantTab onJumpTab={setActive} />
    }
  }, [active, navigation])

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{content}</View>
      <BottomTabs active={active} onChange={setActive} />
    </View>
  )
}
