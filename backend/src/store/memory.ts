import { randomBytes } from 'node:crypto'

export type User = {
  id: string
  phone: string
  createdAt: string
}

export type Consent = {
  userId: string
  privacyPolicyVersion: string
  privacyAcceptedAt: string
  sensitiveAccepted: boolean
  sensitiveAcceptedAt?: string
  locationAccepted: boolean
  locationAcceptedAt?: string
}

export type SmsCode = {
  phone: string
  code: string
  expiresAt: number
}

export type Hospital = {
  id: string
  name: string
  level?: string
  city: string
  address: string
  departments: string[]
  coordinates: { lat: number; lng: number }
}

export type Itinerary = {
  id: string
  userId: string
  hospitalId: string
  departureAddress: string
  budgetLevel: 'low' | 'mid' | 'high'
  departureDate: string
  returnDate: string
  createdAt: string
  plan: unknown
}

function id() {
  return randomBytes(12).toString('hex')
}

class MemoryStore {
  usersById = new Map<string, User>()
  usersByPhone = new Map<string, User>()
  smsCodesByPhone = new Map<string, SmsCode>()
  consentsByUserId = new Map<string, Consent>()
  hospitalsById = new Map<string, Hospital>()
  itinerariesById = new Map<string, Itinerary>()

  upsertUserByPhone(phone: string) {
    const existing = this.usersByPhone.get(phone)
    if (existing) return existing
    const user: User = { id: id(), phone, createdAt: new Date().toISOString() }
    this.usersById.set(user.id, user)
    this.usersByPhone.set(phone, user)
    return user
  }

  setSmsCode(phone: string, code: string, ttlMs: number) {
    const record: SmsCode = { phone, code, expiresAt: Date.now() + ttlMs }
    this.smsCodesByPhone.set(phone, record)
    return record
  }

  verifySmsCode(phone: string, code: string) {
    const record = this.smsCodesByPhone.get(phone)
    if (!record) return false
    if (record.expiresAt < Date.now()) return false
    return record.code === code
  }

  clearSmsCode(phone: string) {
    this.smsCodesByPhone.delete(phone)
  }

  getOrInitConsent(userId: string) {
    const existing = this.consentsByUserId.get(userId)
    if (existing) return existing
    const now = new Date().toISOString()
    const consent: Consent = {
      userId,
      privacyPolicyVersion: 'v1',
      privacyAcceptedAt: now,
      sensitiveAccepted: false,
      locationAccepted: false
    }
    this.consentsByUserId.set(userId, consent)
    return consent
  }
}

let singleton: MemoryStore | undefined

export function getStore() {
  if (!singleton) singleton = new MemoryStore()
  return singleton
}

