import type { DepartmentsResult, ItineraryPlan } from '../types/api'

export type AppStackParamList = {
  Login: undefined
  Consent: undefined
  Tabs: { initialTab?: 'assistant' | 'hospitals' | 'map' | 'surroundings' | 'profile' } | undefined

  // Legacy screens (still kept for compatibility / quick access)
  Symptom: undefined
  HospitalList: { city: string; departments: string[]; analysis: DepartmentsResult }

  Plan: { hospitalId: string; city: string }
  PlanResult: { itineraryId: string; plan: ItineraryPlan; departureDate: string; returnDate: string; hospitalId: string; hospitalName: string }
  Checklist: { itineraryId: string; days: number; hospitalId?: string; hospitalName?: string; plan?: ItineraryPlan }
  ItineraryDetail: { itineraryId: string }
  ItineraryAccommodationEdit: { itineraryId: string }
  Settings: undefined
  ProfileEdit: undefined
  Agreement: undefined
  About: undefined
  HealthRecord: undefined
}
