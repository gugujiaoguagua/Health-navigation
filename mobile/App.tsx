import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider } from './src/auth/AuthContext'
import { UserProvider } from './src/state/UserContext'
import { RootNavigator } from './src/screens/RootNavigator'

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserProvider>
          <RootNavigator />
        </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
