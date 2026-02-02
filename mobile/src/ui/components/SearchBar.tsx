import React from 'react'
import { Pressable, TextInput, View } from 'react-native'

import { theme } from '../theme'
import { Text } from './Text'

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  onClear
}: {
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  onClear?: () => void
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[2],
        borderWidth: 1,
        borderColor: theme.color.border,
        borderRadius: theme.radius.xl,
        paddingHorizontal: theme.space[3],
        height: 44,
        backgroundColor: theme.color.background
      }}
    >
      <Text style={{ color: theme.color.mutedForeground }}>🔎</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.color.mutedForeground}
        style={{ flex: 1, color: theme.color.text, paddingVertical: 0 }}
      />
      {value.trim().length > 0 && onClear ? (
        <Pressable onPress={onClear} hitSlop={10}>
          <Text style={{ color: theme.color.mutedForeground }}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  )
}
