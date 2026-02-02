import React from 'react'
import { SafeAreaView, ScrollView, View } from 'react-native'

import { theme } from '../ui/theme'
import { Card } from '../ui/components/Card'
import { Text } from '../ui/components/Text'

export function AgreementScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.secondary }}>
      <ScrollView contentContainerStyle={{ padding: theme.space[4], gap: theme.space[3] }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 4 }}>
          <Text variant="title">协议与公告</Text>
          <Text variant="caption">用户协议（示例文本） | 更新日期：2026-01-30</Text>
        </View>

        <Card>
          <View style={{ gap: theme.space[3] }}>
            <Text style={{ fontWeight: '700' }}>一、协议确认</Text>
            <Text>
              欢迎使用本应用（“健康导航”）。您在注册、登录或使用本应用服务前，应当仔细阅读并同意本用户协议。您开始使用即视为已充分理解并接受本协议全部条款。
            </Text>

            <Text style={{ fontWeight: '700' }}>二、服务说明</Text>
            <Text>
              本应用为就医出行信息整理与行程辅助工具，包含但不限于：就医建议展示、行程计划管理、就医清单整理、医院信息浏览等功能。本应用提供的内容仅供参考，不构成医疗诊断或治疗建议。
            </Text>

            <Text style={{ fontWeight: '700' }}>三、账号与使用规范</Text>
            <Text>
              您应妥善保管账号信息，并对账号下发生的行为负责。您承诺不利用本应用从事违法违规活动，不发布或传播侵权、虚假、骚扰、暴力、恶意内容，不进行破坏系统安全的行为。
            </Text>

            <Text style={{ fontWeight: '700' }}>四、隐私与信息保护</Text>
            <Text>
              我们会按照相关法律法规及隐私政策对您的个人信息进行处理与保护。为实现核心功能，本应用可能需要获取并处理您提供的资料（如昵称、联系方式、地址）以及您在使用过程中产生的内容（如行程与清单）。在未获得您明确同意的情况下，我们不会向无关第三方提供您的个人信息，但法律法规另有规定或监管要求除外。
            </Text>

            <Text style={{ fontWeight: '700' }}>五、内容与第三方信息</Text>
            <Text>
              本应用可能展示来自第三方的信息或链接（例如医院介绍、地图服务）。第三方内容的准确性、完整性与合法性由第三方负责。您与第三方的交易或服务使用应遵守第三方规则，本应用不对第三方服务承担保证责任。
            </Text>

            <Text style={{ fontWeight: '700' }}>六、免责与责任限制</Text>
            <Text>
              在法律允许范围内，本应用对因不可抗力、网络故障、系统维护、第三方原因等导致的服务中断或数据丢失不承担责任。对于依据本应用信息而作出的就医或出行决定所造成的损失，本应用不承担任何直接或间接责任。若本应用存在过错并依法应承担责任的，责任范围以实际直接损失为限。
            </Text>

            <Text style={{ fontWeight: '700' }}>七、协议变更与终止</Text>
            <Text>
              我们可能根据业务需要或法律变化对本协议进行更新，并在应用内以合理方式提示。若您不同意更新内容，应停止使用服务；继续使用视为接受更新。若您严重违反本协议，我们有权限制或终止向您提供服务。
            </Text>

            <Text style={{ fontWeight: '700' }}>八、联系我们</Text>
            <Text>
              如您对本协议有任何疑问，可通过应用内反馈渠道与我们联系。我们会在合理期限内处理您的问题与建议。
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}
