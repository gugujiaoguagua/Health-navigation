import React, { useMemo, useState } from 'react'
import { Alert, SafeAreaView, View, Image, TouchableOpacity, ScrollView } from 'react-native'

import { useAuth } from '../../auth/AuthContext'
import { useUser } from '../../state/UserContext'
import { useAppUI } from '../../state/AppUIContext'
import { theme } from '../../ui/theme'
import { Button } from '../../ui/components/Button'
import { Card } from '../../ui/components/Card'
import { Text } from '../../ui/components/Text'

export function ProfileTab({
  onOpenAgreement,
  onOpenAbout,
  onOpenHealthRecord,
  onOpenProfileEdit,
  onOpenItinerary
}: {
  onOpenAgreement: () => void
  onOpenAbout: () => void
  onOpenHealthRecord: () => void
  onOpenProfileEdit: () => void
  onOpenItinerary: (itineraryId: string) => void
}) {
  const { setToken } = useAuth()
  const { profile } = useUser()
  const { state, setLanguage } = useAppUI()
  const [languageOpen, setLanguageOpen] = useState(false)

  const pinned = state.savedItineraries.filter((it) => it.isPinned)
  const healthCount = state.healthRecords.length
  const healthPending = state.healthRecords.filter((r) => r.scanStatus === 'pending').length
  const healthStatusText = (state.healthInsight?.conditions ?? []).slice(0, 2).join('、')

  const languageLabel = useMemo(() => {
    return state.language === 'zh' ? '中文' : state.language === 'en' ? 'English' : 'Русский'
  }, [state.language])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: theme.space[4], gap: theme.space[3] }}>
          <TouchableOpacity
            onPress={onOpenProfileEdit}
            style={{
              backgroundColor: theme.color.primary,
              borderRadius: theme.radius.xl,
              padding: theme.space[4],
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space[4]
            }}
          >
            <Image
              source={{ uri: profile.avatar }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(255,255,255,0.2)'
              }}
            />
            <View style={{ flex: 1 }}>
              <Text variant="h2" style={{ color: theme.color.primaryForeground }}>
                {profile.name}
              </Text>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {profile.id}
              </Text>
            </View>
          </TouchableOpacity>

          {pinned.length > 0 && (
            <Card>
              <View style={{ gap: theme.space[2] }}>
                <Text variant="caption" style={{ color: theme.color.mutedForeground, marginBottom: 4 }}>
                  置顶行程
                </Text>
                {pinned.map((it) => (
                  <TouchableOpacity
                    key={it.itineraryId}
                    onPress={() => onOpenItinerary(it.itineraryId)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: theme.space[2],
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(0,0,0,0.05)'
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600' }} numberOfLines={1}>
                        {it.hospitalName || '未命名行程'}
                      </Text>
                      <Text variant="caption" style={{ color: theme.color.mutedForeground }}>
                        天数：{it.days} | {new Date(it.savedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={{ color: theme.color.primary, fontSize: 12 }}>查看</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          <TouchableOpacity onPress={onOpenHealthRecord} activeOpacity={0.85}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.space[3] }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ fontWeight: '700' }}>健康档案</Text>
                  <Text variant="caption" style={{ color: theme.color.mutedForeground }}>
                    {healthCount ? `已录入 ${healthCount} 条${healthPending ? `（扫描中 ${healthPending}）` : ''}` : '上传医疗文件或录入文字，自动扫描推荐食谱'}
                    {healthStatusText ? ` | 状态：${healthStatusText}` : ''}
                  </Text>
                </View>
                <Text style={{ color: theme.color.primary, fontSize: 12, fontWeight: '700' }}>进入</Text>
              </View>
            </Card>
          </TouchableOpacity>

        <Card>
          <View style={{ gap: theme.space[2] }}>
            <Button title={`语言：${languageLabel}`} variant="outline" onPress={() => setLanguageOpen((v) => !v)} />
            {languageOpen ? (
              <View style={{ gap: theme.space[2] }}>
                <Button
                  title="中文"
                  variant={state.language === 'zh' ? 'primary' : 'outline'}
                  onPress={() => {
                    setLanguage('zh')
                    setLanguageOpen(false)
                  }}
                />
                <Button
                  title="English"
                  variant={state.language === 'en' ? 'primary' : 'outline'}
                  onPress={() => {
                    setLanguage('en')
                    setLanguageOpen(false)
                  }}
                />
                <Button
                  title="Русский"
                  variant={state.language === 'ru' ? 'primary' : 'outline'}
                  onPress={() => {
                    setLanguage('ru')
                    setLanguageOpen(false)
                  }}
                />
              </View>
            ) : null}
            <Button title="协议与公告" variant="outline" onPress={onOpenAgreement} />
            <Button title="关于" variant="outline" onPress={onOpenAbout} />
          </View>
        </Card>

        <Card>
          <View style={{ gap: theme.space[2] }}>
            <Button
              title="退出登录"
              variant="destructive"
              onPress={() => {
                Alert.alert('确认退出', '将清除本地Token', [
                  { text: '取消', style: 'cancel' },
                  { text: '退出', style: 'destructive', onPress: async () => setToken(null) }
                ])
              }}
            />
          </View>
        </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
