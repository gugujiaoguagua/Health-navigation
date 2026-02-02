import React from 'react'
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native'

import { theme } from '../theme'
import { Text } from './Text'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'

type Props = PressableProps & {
  title: string
  loading?: boolean
  variant?: Variant
}

export function Button({ title, loading, disabled, variant = 'primary', style, ...props }: Props) {
  const isDisabled = Boolean(disabled || loading)

  const base = {
    height: 44,
    borderRadius: theme.radius.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: theme.space[2],
    paddingHorizontal: theme.space[4]
  }

  const variantStyle =
    variant === 'primary'
      ? { backgroundColor: theme.color.primary, borderWidth: 0 }
      : variant === 'secondary'
        ? { backgroundColor: theme.color.secondary, borderWidth: 0 }
        : variant === 'outline'
          ? { backgroundColor: theme.color.background, borderWidth: 1, borderColor: theme.color.border }
          : variant === 'destructive'
            ? { backgroundColor: theme.color.destructive, borderWidth: 0 }
            : { backgroundColor: 'transparent', borderWidth: 0 }

  const textColor =
    variant === 'primary' || variant === 'destructive'
      ? theme.color.primaryForeground
      : variant === 'ghost'
        ? theme.color.primary
        : theme.color.text

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={({ pressed }) => [
        base,
        variantStyle,
        isDisabled ? { opacity: 0.6 } : null,
        pressed && !isDisabled ? { opacity: 0.85 } : null,
        style as any
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : null}
      <View style={{ flexShrink: 1 }}>
        <Text style={{ color: textColor, fontWeight: '600' }}>{title}</Text>
      </View>
    </Pressable>
  )
}
