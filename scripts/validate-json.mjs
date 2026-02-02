import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(process.cwd(), '..')
const files = [
  'product_architecture.json',
  'module_breakdown.json',
  'modules_engineering_plan.json',
  'modules_implementation_plan.json',
  'test_plan.json',
  'security_audit_report.json',
  '门禁报告_20260123.json',
  '项目归档报告.json'
]

let ok = true

for (const f of files) {
  const p = path.join(root, f)
  try {
    const content = await fs.readFile(p, 'utf8')
    JSON.parse(content)
    process.stdout.write(`${f} OK\n`)
  } catch (e) {
    ok = false
    const msg = e instanceof Error ? e.message : String(e)
    process.stdout.write(`${f} FAIL: ${msg}\n`)
  }
}

process.exit(ok ? 0 : 1)

