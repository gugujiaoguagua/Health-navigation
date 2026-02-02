import fs from 'node:fs/promises'
import path from 'node:path'

import type { Hospital } from '../../store/memory.js'

export async function loadHospitalsFromFile() {
  const root = path.resolve(process.cwd(), '..')
  const file = process.env.HOSPITALS_FILE ?? path.join(root, 'data', 'hospitals.sample.json')
  const raw = await fs.readFile(file, 'utf8')
  const hospitals = JSON.parse(raw) as Hospital[]
  return hospitals
}

