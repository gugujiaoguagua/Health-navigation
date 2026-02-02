import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView, Switch, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { apiFetch, getToken } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Consent } from '../types/api'
import type { AppStackParamList } from './navTypes'
import { theme } from '../ui/theme'
import { Button } from '../ui/components/Button'
import { Card } from '../ui/components/Card'
import { Text } from '../ui/components/Text'

type Props = NativeStackScreenProps<AppStackParamList, 'Consent'> & {
  onConsentUpdated?: (consent: Consent) => void
}

function makeDemoConsent(): Consent {
  const now = new Date().toISOString()
  return {
    // preferred snake_case
    user_id: 'demo',
    privacy_policy_version: 'demo',
    privacy_accepted_at: now,
    sensitive_accepted: true,
    sensitive_accepted_at: now,
    location_accepted: true,
    location_accepted_at: now,

    // compat camelCase
    userId: 'demo',
    privacyPolicyVersion: 'demo',
    privacyAcceptedAt: now,
    sensitiveAccepted: true,
    sensitiveAcceptedAt: now,
    locationAccepted: true,
    locationAcceptedAt: now
  }
}

export function ConsentScreen({ onConsentUpdated }: Props) {
  const { setToken } = useAuth()
  const [consent, setConsent] = useState<Consent | null>(null)
  const [sensitive, setSensitive] = useState(false)
  const [location, setLocation] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const canContinue = useMemo(() => !saving && sensitive && location, [saving, sensitive, location])

  useEffect(() => {
    ;(async () => {
      try {
        await getToken()
      } catch {
        // ignore
      }

      try {
        const resp = await apiFetch<{ ok: true; consent: Consent }>('/v1/consents', { method: 'GET' })
        setConsent(resp.consent)
        setSensitive(resp.consent.sensitiveAccepted)
        setLocation(resp.consent.locationAccepted)

        if (resp.consent.sensitiveAccepted && resp.consent.locationAccepted) {
          onConsentUpdated?.(resp.consent)
        }
      } catch (e: any) {
        if (String(e?.error ?? '') === 'UNAUTHORIZED') {
          await setToken(null)
          return
        }
        // Web 上 Alert 可能不明显，直接显示在页面上
        setErrorText(`加载授权失败：${e?.error ?? e?.message ?? '未知错误'}`)
      }
    })()
  }, [onConsentUpdated])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
      <View style={{ flex: 1, padding: theme.space[4], gap: theme.space[3] }}>
        <View style={{ gap: 4 }}>
          <Text variant="title">隐私与授权</Text>
        </View>

        <Card>
          <View style={{ gap: theme.space[3] }}>
            <Row
              title="敏感信息单独同意（症状/健康信息）"
              value={sensitive}
              onValueChange={(v) => {
                setSensitive(v)
                setErrorText(null)
              }}
              disabled={consent?.sensitiveAccepted}
            />
            <Row
              title="位置信息同意（用于路线/附近医院）"
              value={location}
              onValueChange={(v) => {
                setLocation(v)
                setErrorText(null)
              }}
              disabled={consent?.locationAccepted}
            />

            {errorText ? <Text style={{ color: theme.color.destructive, fontWeight: '700' }}>{errorText}</Text> : null}

            <Button
              title={saving ? '保存中…' : '保存并继续'}
              loading={saving}
              disabled={!canContinue}
              onPress={async () => {
                setSaving(true)
                setErrorText(null)

                // 先乐观进入主页，避免“保存成功但 UI 卡住”
                const optimistic = consent
                  ? { ...consent, sensitiveAccepted: true, locationAccepted: true, sensitiveAcceptedAt: consent.sensitiveAcceptedAt ?? new Date().toISOString(), locationAcceptedAt: consent.locationAcceptedAt ?? new Date().toISOString() }
                  : makeDemoConsent()
                onConsentUpdated?.(optimistic)

                try {
                  const resp = await apiFetch<{ ok: true; consent: Consent }>('/v1/consents', {
                    method: 'POST',
                    body: JSON.stringify({ accept_sensitive: true, accept_location: true, accept_privacy: true })
                  })
                  setConsent(resp.consent)
                  onConsentUpdated?.(resp.consent)
                } catch (e: any) {
                  setErrorText(`保存失败（已进入预览）：${e?.error ?? e?.message ?? '未知错误'}`)
                } finally {
                  setSaving(false)
                }
              }}
            />

          </View>
        </Card>
      </View>
    </SafeAreaView>
  )
}

function Row({
  title,
  value,
  onValueChange,
  disabled
}: {
  title: string
  value: boolean
  onValueChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.space[3] }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600' }}>{title}</Text>
        {disabled ? <Text variant="caption">已同意</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
    </View>
  )
}
