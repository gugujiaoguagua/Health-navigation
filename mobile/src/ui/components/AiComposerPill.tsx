import React from 'react'
import { Pressable, TextInput, View } from 'react-native'

import { theme } from '../theme'
import { Text } from './Text'

type Props = {
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  onMicPress?: () => void
}

export function AiComposerPill({ value, onChangeText, placeholder, disabled, loading, onMicPress }: Props) {
  const isDisabled = Boolean(disabled || loading)

  return (
    <View
      style={{
        position: 'relative',
        borderRadius: 1000,
        padding: 8,
        maxWidth: 260,
        width: '100%',
        backgroundColor: '#B3D0FD' // rgb(179, 208, 253)
      }}
    >
      {/* pseudo ::before */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -1,
          left: -1,
          right: -1,
          bottom: -1,
          borderRadius: 1000,
          backgroundColor: '#FFFFFF',
          opacity: 0.5
        }}
      />

      {/* pseudo ::after */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 1,
          left: 1,
          right: -1,
          bottom: -1,
          borderRadius: 1000,
          backgroundColor: '#D3E8FF',
          shadowColor: 'rgba(79,156,232,0.55)',
          shadowOffset: { width: 3, height: 3 },
          shadowOpacity: 1,
          shadowRadius: 14,
          elevation: 4
        }}
      />

      <View
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: 50,
          backgroundColor: '#DAE8F7',
          padding: 5,
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        {/* 入口态：不直接编辑，点击由外层触发打开对话框 */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={false}
          pointerEvents="none"
          placeholder={placeholder}
          placeholderTextColor={'#9EBCD9'}
          style={{
            flex: 1,
            height: 40,
            paddingVertical: 0,
            paddingHorizontal: 12,
            backgroundColor: '#DAE8F7',
            borderRadius: 50,
            color: theme.color.text,
            fontSize: 15
          }}
        />

        <Pressable
          disabled={isDisabled}
          onPress={onMicPress}
          style={({ pressed }) => [
            {
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 6,
              borderLeftWidth: 2,
              borderLeftColor: '#FFFFFF',
              borderRadius: 20
            },
            pressed && !isDisabled ? { opacity: 0.85 } : null,
            isDisabled ? { opacity: 0.5 } : null
          ]}
        >
          <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '800' }}>{loading ? '…' : 'MIC'}</Text>
        </Pressable>
      </View>
    </View>
  )
}
