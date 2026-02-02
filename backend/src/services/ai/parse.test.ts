import assert from 'node:assert/strict'
import test from 'node:test'

import { parseAiDepartmentJson } from './parse.js'

test('parseAiDepartmentJson extracts json object from content', () => {
  const parsed = parseAiDepartmentJson({
    content:
      '一些前置文本 {\"departments\":[{\"name\":\"内科\",\"confidence\":0.8,\"reason\":\"测试\"}],\"summary\":\"ok\"} 一些尾部文本'
  })
  assert.equal(Array.isArray((parsed as any).departments), true)
})

