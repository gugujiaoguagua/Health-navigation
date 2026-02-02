import React from 'react'
import { View } from 'react-native'

import { theme } from '../theme'
import { Text } from './Text'

type Variant = 'default' | 'secondary' | 'outline' | 'destructive'

export function Badge({ label, variant = 'secondary' }: { label: string; variant?: Variant }) {
  const style =
    variant === 'default'
      ? { backgroundColor: theme.color.primary, borderColor: theme.color.primary }
      : variant === 'destructive'
        ? { backgroundColor: theme.color.destructive, borderColor: theme.color.destructive }
        : variant === 'outline'
          ? { backgroundColor: 'transparent', borderColor: theme.color.border }
          : { backgroundColor: theme.color.secondary, borderColor: theme.color.secondary }

  const color = variant === 'default' || variant === 'destructive' ? theme.color.primaryForeground : theme.color.text

  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        ...style
      }}
    >
      <Text style={{ fontSize: theme.font.caption, color }}>{label}</Text>
    </View>
  )
}
