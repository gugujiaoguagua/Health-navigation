import assert from 'node:assert/strict'
import test from 'node:test'

import { emergencyHeuristic } from './emergency.js'

test('emergencyHeuristic detects emergency keywords', () => {
  assert.equal(emergencyHeuristic('出现胸痛并呼吸困难'), true)
  assert.equal(emergencyHeuristic('轻微咳嗽两天'), false)
})

