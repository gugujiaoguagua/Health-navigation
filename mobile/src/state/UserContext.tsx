import React, { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

export type UserProfile = {
  name: string
  id: string
  avatar: string
  phone: string
  address: string
}

type UserContextType = {
  profile: UserProfile
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>
  loading: boolean
}

const DEFAULT_PROFILE: UserProfile = {
  name: '未登录用户',
  id: 'ID: 000001',
  avatar: 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff',
  phone: '',
  address: ''
}

const PROFILE_KEY = 'user_profile'

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        let stored: string | null = null
        if (Platform.OS === 'web') {
          stored = localStorage.getItem(PROFILE_KEY)
        } else {
          stored = await SecureStore.getItemAsync(PROFILE_KEY)
        }

        if (stored) {
          setProfile(JSON.parse(stored))
        }
      } catch (e) {
        console.error('Failed to load profile', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates }
    setProfile(newProfile)
    try {
      const data = JSON.stringify(newProfile)
      if (Platform.OS === 'web') {
        localStorage.setItem(PROFILE_KEY, data)
      } else {
        await SecureStore.setItemAsync(PROFILE_KEY, data)
      }
    } catch (e) {
      console.error('Failed to save profile', e)
    }
  }

  return (
    <UserContext.Provider value={{ profile, updateProfile, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
