import React, { useState } from 'react'
import { SafeAreaView, View, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { useUser } from '../state/UserContext'
import { theme } from '../ui/theme'
import { Button } from '../ui/components/Button'
import { Text } from '../ui/components/Text'
import type { AppStackParamList } from './navTypes'

type Props = NativeStackScreenProps<AppStackParamList, 'ProfileEdit'>

export function ProfileEditScreen({ navigation }: Props) {
  const { profile, updateProfile } = useUser()
  const [name, setName] = useState(profile.name)
  const [id, setId] = useState(profile.id)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [phone, setPhone] = useState(profile.phone)
  const [address, setAddress] = useState(profile.address)

  const handleSave = async () => {
    await updateProfile({ name, id, avatar, phone, address })
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="h2">修改个人信息</Text>
        </View>

        <View style={styles.avatarSection}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <TouchableOpacity 
            onPress={() => {
              // In a real app, this would open an image picker
              const newAvatar = `https://ui-avatars.com/api/?name=${name}&background=random`
              setAvatar(newAvatar)
            }}
            style={styles.avatarButton}
          >
            <Text style={{ color: theme.color.primary }}>更换头像</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text variant="caption" style={styles.label}>名字</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="请输入名字"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text variant="caption" style={styles.label}>ID</Text>
            <TextInput
              style={styles.input}
              value={id}
              onChangeText={setId}
              placeholder="请输入ID"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text variant="caption" style={styles.label}>电话</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="请输入电话"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text variant="caption" style={styles.label}>地址</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="请输入地址"
              multiline
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Button title="保存" onPress={handleSave} />
          <Button title="取消" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.secondary
  },
  scrollContent: {
    padding: theme.space[4]
  },
  header: {
    marginBottom: theme.space[6]
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: theme.space[6]
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
    marginBottom: theme.space[2]
  },
  avatarButton: {
    padding: theme.space[2]
  },
  form: {
    gap: theme.space[4],
    marginBottom: 48 // 在原有 40 (theme.space[10] 逻辑值) 的基础上加宽 20%
  },
  inputGroup: {
    gap: theme.space[1]
  },
  label: {
    color: theme.color.mutedForeground,
    marginLeft: theme.space[1]
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: theme.radius.md,
    padding: theme.space[3],
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    height: 48 // 统一单行输入框高度
  },
  textArea: {
    height: 48, // 统一高度为 48
    textAlignVertical: 'top',
    paddingTop: theme.space[3]
  },
  footer: {
    gap: theme.space[3]
  }
})
