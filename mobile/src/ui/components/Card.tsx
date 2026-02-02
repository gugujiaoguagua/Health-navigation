import React from 'react'
import { View, type ViewProps } from 'react-native'

import { theme } from '../theme'

export function Card({ style, ...props }: ViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: theme.color.border,
          backgroundColor: theme.color.background,
          borderRadius: theme.radius.lg,
          padding: theme.space[4]
        },
        style
      ]}
    />
  )
}

export function SectionCard({ style, ...props }: ViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: theme.color.secondary,
          borderRadius: theme.radius.lg,
          padding: theme.space[4]
        },
        style
      ]}
    />
  )
}
