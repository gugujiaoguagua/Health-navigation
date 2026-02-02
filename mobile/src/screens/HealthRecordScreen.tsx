import React, { useMemo, useState } from 'react'
import { Alert, Platform, SafeAreaView, ScrollView, TextInput, TouchableOpacity, View } from 'react-native'

import { useUser } from '../state/UserContext'
import { useAppUI } from '../state/AppUIContext'
import { theme } from '../ui/theme'
import { Button } from '../ui/components/Button'
import { Card } from '../ui/components/Card'
import { Text } from '../ui/components/Text'

export function HealthRecordScreen() {
  const { profile } = useUser()
  const { state, addHealthFiles, addHealthText, removeHealthRecord } = useAppUI()
  const [text, setText] = useState('')

  const summary = useMemo(() => {
    const total = state.healthRecords.length
    const pending = state.healthRecords.filter((r) => r.scanStatus === 'pending').length
    const conditions = state.healthInsight?.conditions ?? []
    return { total, pending, conditions }
  }, [state.healthInsight?.conditions, state.healthRecords])

  const pickWebFiles = async () => {
    try {
      const doc: any = (globalThis as any).document
      if (!doc) {
        Alert.alert('上传失败', '当前环境不支持选择文件')
        return
      }
      const input = doc.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = 'image/*,.pdf,.doc,.docx,.txt'
      input.onchange = async () => {
        const files: any[] = Array.from(input.files || [])
        if (!files.length) return
        await addHealthFiles(
          files.map((f) => ({
            name: String(f?.name ?? ''),
            type: String(f?.type ?? ''),
            size: Number(f?.size ?? 0) || 0
          }))
        )
      }
      input.click()
    } catch (e: any) {
      Alert.alert('上传失败', e?.message ?? '未知错误')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
      <ScrollView contentContainerStyle={{ padding: theme.space[4], gap: theme.space[3] }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 4 }}>
          <Text variant="title">健康档案</Text>
          <Text variant="caption">上传或录入资料后会自动扫描并推荐食谱</Text>
        </View>

        <Card>
          <View style={{ gap: theme.space[2] }}>
            <Text style={{ fontWeight: '700' }}>我的信息</Text>
            <View style={{ gap: 6 }}>
              <Row label="姓名" value={profile.name} />
              <Row label="ID" value={profile.id} />
              <Row label="电话" value={profile.phone || '-'} />
              <Row label="地址" value={profile.address || '-'} />
            </View>
          </View>
        </Card>

        <Card>
          <View style={{ gap: theme.space[2] }}>
            <Text style={{ fontWeight: '700' }}>上传/录入</Text>

            <Button
              title={Platform.OS === 'web' ? '上传医疗文件（图片/文档）' : '上传医疗文件（Web可用）'}
              variant="outline"
              disabled={Platform.OS !== 'web'}
              onPress={pickWebFiles}
            />

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="粘贴病历/检查结果文字（例如：诊断：高血压…）"
              multiline
              style={{
                borderWidth: 1,
                borderColor: theme.color.border,
                backgroundColor: theme.color.background,
                borderRadius: theme.radius.lg,
                padding: theme.space[3],
                minHeight: 96,
                fontSize: 14
              }}
            />

            <Button
              title="添加文字记录"
              onPress={async () => {
                await addHealthText(text)
                setText('')
              }}
              disabled={!text.trim()}
            />
          </View>
        </Card>

        <Card>
          <View style={{ gap: theme.space[2] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '700' }}>档案概览</Text>
              <Text variant="caption">
                {summary.total} 条{summary.pending ? `（扫描中 ${summary.pending}）` : ''}
              </Text>
            </View>

            {summary.conditions.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] }}>
                {summary.conditions.map((c) => (
                  <View
                    key={c}
                    style={{
                      paddingHorizontal: theme.space[3],
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: 'rgba(13,138,188,0.12)',
                      borderWidth: 1,
                      borderColor: 'rgba(13,138,188,0.25)'
                    }}
                  >
                    <Text style={{ color: theme.color.primary, fontSize: 12, fontWeight: '700' }}>{c}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text variant="caption">暂无识别到健康状态，先录入一些资料吧</Text>
            )}
          </View>
        </Card>

        <Card>
          <View style={{ gap: theme.space[2] }}>
            <Text style={{ fontWeight: '700' }}>食谱推荐</Text>
            {state.healthInsight?.recipes?.length ? (
              <View style={{ gap: theme.space[2] }}>
                {state.healthInsight.recipes.map((r) => (
                  <View
                    key={r.title}
                    style={{
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.06)',
                      borderRadius: theme.radius.lg,
                      padding: theme.space[3],
                      backgroundColor: 'rgba(0,0,0,0.015)'
                    }}
                  >
                    <Text style={{ fontWeight: '700' }}>{r.title}</Text>
                    <Text variant="caption">{r.reason}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text variant="caption">录入文字或上传文件后，会根据识别结果更新推荐</Text>
            )}
          </View>
        </Card>

        <Card>
          <View style={{ gap: theme.space[2] }}>
            <Text style={{ fontWeight: '700' }}>我的资料</Text>
            {state.healthRecords.length ? (
              <View style={{ gap: theme.space[2] }}>
                {state.healthRecords.map((r) => (
                  <View
                    key={r.id}
                    style={{
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.06)',
                      borderRadius: theme.radius.lg,
                      padding: theme.space[3],
                      backgroundColor: theme.color.background
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.space[2] }}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontWeight: '700' }} numberOfLines={1}>
                          {r.kind === 'file' ? r.fileName || '文件' : '文字记录'}
                        </Text>
                        <Text variant="caption">
                          {r.kind === 'file'
                            ? `${r.scanStatus === 'pending' ? '扫描中…' : '已扫描'}${r.mime ? ` | ${r.mime}` : ''}`
                            : (r.text ?? '').slice(0, 40)}
                        </Text>
                        <Text variant="caption">{new Date(r.addedAt).toLocaleString()}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeHealthRecord(r.id)}
                        style={{ paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' }}
                      >
                        <Text style={{ color: theme.color.destructive, fontWeight: '700', fontSize: 12 }}>删除</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text variant="caption">暂无资料</Text>
            )}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.space[3] }}>
      <Text variant="caption">{label}</Text>
      <Text style={{ fontWeight: '600' }}>{value}</Text>
    </View>
  )
}
