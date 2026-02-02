import React from 'react'
import { View } from 'react-native'

import { theme } from '../theme'
import { Card } from './Card'
import { Text } from './Text'
import { Button } from './Button'

export function EmptyState({
  title,
  description,
  actionText,
  onAction
}: {
  title: string
  description?: string
  actionText?: string
  onAction?: () => void
}) {
  return (
    <Card>
      <View style={{ gap: theme.space[2] }}>
        <Text variant="h2">{title}</Text>
        {description ? <Text variant="muted">{description}</Text> : null}
        {actionText && onAction ? (
          <View style={{ paddingTop: theme.space[2] }}>
            <Button title={actionText} variant="outline" onPress={onAction} />
          </View>
        ) : null}
      </View>
    </Card>
  )
}
