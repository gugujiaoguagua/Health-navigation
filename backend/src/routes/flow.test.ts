import assert from 'node:assert/strict'
import test from 'node:test'

import request from 'supertest'

import { createApp } from '../app.js'

test('end-to-end flow: login -> consent -> analyze -> recommend -> plan -> checklist', async () => {
  process.env.AI_MODE = 'mock'
  process.env.SMS_MODE = 'mock'

  const app = createApp()

  const phone = '13800138000'
  const send = await request(app).post('/v1/auth/send-code').send({ phone })
  assert.equal(send.status, 200)
  assert.equal(send.body.ok, true)
  const code = send.body.mock_code
  assert.equal(typeof code, 'string')

  const login = await request(app).post('/v1/auth/login-with-code').send({ phone, code })
  assert.equal(login.status, 200)
  const token = login.body.access_token
  assert.equal(typeof token, 'string')

  const consent = await request(app)
    .post('/v1/consents')
    .set('Authorization', `Bearer ${token}`)
    .send({ acceptSensitive: true, acceptLocation: true })
  assert.equal(consent.status, 200)
  assert.equal(consent.body.consent.sensitiveAccepted, true)

  const analysis = await request(app)
    .post('/v1/ai/analyze')
    .set('Authorization', `Bearer ${token}`)
    .send({ symptom_text: '咳嗽两天，有点发热' })
  assert.equal(analysis.status, 200)
  assert.equal(Array.isArray(analysis.body.departments), true)

  const hospitals = await request(app).get('/v1/hospitals').query({ city: '上海', department: '内科' })
  assert.equal(hospitals.status, 200)
  assert.equal(hospitals.body.ok, true)
  assert.ok(hospitals.body.total >= 1)
  const hospitalId = hospitals.body.data[0].id

  const plan = await request(app)
    .post('/v1/itineraries/plan')
    .set('Authorization', `Bearer ${token}`)
    .send({
      hospital_id: hospitalId,
      departure_address: '上海虹桥火车站',
      budget_level: 'mid',
      departure_date: '2026-02-01',
      return_date: '2026-02-03',
      city: '上海'
    })
  assert.equal(plan.status, 200)
  assert.equal(plan.body.ok, true)
  assert.equal(typeof plan.body.itinerary_id, 'string')

  const checklist = await request(app)
    .post('/v1/checklists/generate')
    .set('Authorization', `Bearer ${token}`)
    .send({ itinerary_id: plan.body.itinerary_id, days: 3 })
  assert.equal(checklist.status, 200)
  assert.equal(checklist.body.ok, true)
  assert.equal(Array.isArray(checklist.body.checklist.categories), true)
})

