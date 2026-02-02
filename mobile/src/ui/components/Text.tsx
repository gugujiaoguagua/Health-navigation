import React from 'react'
import { Text as RNText, type TextProps } from 'react-native'

import { theme } from '../theme'

type Variant = 'title' | 'h2' | 'body' | 'muted' | 'caption'

export function Text({ style, ...props }: TextProps & { variant?: Variant }) {
  const variant = (props as any).variant as Variant | undefined
  const baseStyle = {
    color: theme.color.text,
    fontSize: theme.font.body
  }

  const variantStyle =
    variant === 'title'
      ? { fontSize: theme.font.title, fontWeight: '700' as const }
      : variant === 'h2'
        ? { fontSize: theme.font.h2, fontWeight: '600' as const }
        : variant === 'muted'
          ? { fontSize: theme.font.body, color: theme.color.mutedForeground }
          : variant === 'caption'
            ? { fontSize: theme.font.caption, color: theme.color.mutedForeground }
            : {}

  const { variant: _variant, ...rest } = props as any

  return <RNText {...rest} style={[baseStyle, variantStyle, style]} />
}
