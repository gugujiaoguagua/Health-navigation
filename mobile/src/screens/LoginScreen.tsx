import React, { useMemo, useState } from 'react'
import { Alert, Button, SafeAreaView, Text, TextInput, View } from 'react-native'

import { apiFetch, getApiBaseUrl } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { LoginResponse } from '../types/api'

export function LoginScreen() {
  const { setToken } = useAuth()
  const [phone, setPhone] = useState('13800138000')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const phoneValid = useMemo(() => /^1\d{10}$/.test(phone.trim()), [phone])
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), [])

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>登录</Text>
      <Text style={{ color: '#444' }}>手机号验证码（默认mock模式会回传验证码，便于演示）</Text>
      <Text style={{ color: '#666' }}>API：{apiBaseUrl}</Text>
      {errorText ? <Text style={{ color: '#b91c1c', fontWeight: '700' }}>{errorText}</Text> : null}

      <View style={{ gap: 8 }}>
        <Text>手机号</Text>
        <TextInput
          value={phone}
          onChangeText={(v) => {
            setPhone(v)
            setErrorText(null)
          }}
          keyboardType="phone-pad"
          placeholder="请输入手机号"
          style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
        />
        <Button
          title={sending ? '发送中…' : '获取验证码'}
          disabled={!phoneValid || sending}
          onPress={async () => {
            setSending(true)
            setErrorText(null)
            try {
              const resp = await apiFetch<{ ok: true; mock_code?: string }>('/v1/auth/send-code', {
                method: 'POST',
                body: JSON.stringify({ phone })
              })
              if (resp.mock_code) {
                setCode(resp.mock_code)
                Alert.alert('验证码（mock）', resp.mock_code)
              } else {
                Alert.alert('已发送', '请查看短信')
              }
            } catch (e: any) {
              const msg = `${e?.error ?? '未知错误'}${e?.message ? `：${e.message}` : ''}`
              setErrorText(`发送失败：${msg}`)
              Alert.alert('发送失败', msg)
            } finally {
              setSending(false)
            }
          }}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text>验证码</Text>
        <TextInput
          value={code}
          onChangeText={(v) => {
            setCode(v)
            setErrorText(null)
          }}
          keyboardType="number-pad"
          placeholder="6位验证码"
          style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
        />
        <Button
          title={loggingIn ? '登录中…' : '登录'}
          disabled={!phoneValid || !/^\d{6}$/.test(code) || loggingIn}
          onPress={async () => {
            setLoggingIn(true)
            setErrorText(null)
            try {
              const resp = await apiFetch<LoginResponse>('/v1/auth/login-with-code', {
                method: 'POST',
                body: JSON.stringify({ phone, code })
              })
              await setToken(resp.access_token)
            } catch (e: any) {
              const msg = `${e?.error ?? '未知错误'}${e?.message ? `：${e.message}` : ''}`
              setErrorText(`登录失败：${msg}`)
              Alert.alert('登录失败', msg)
            } finally {
              setLoggingIn(false)
            }
          }}
        />

        <Button
          title="离线进入演示（不依赖后端）"
          disabled={sending || loggingIn}
          onPress={async () => {
            setErrorText(null)
            await setToken('demo-offline')
          }}
        />
      </View>
    </SafeAreaView>
  )
}

