/**
 * Demo-data voor ShiftSync — 10 medewerkers + beschikbaarheid, verlof, ziek, diensten, ruilen, klok.
 *
 * Vereist service role key (Supabase Dashboard → Settings → API → service_role).
 *
 * Gebruik (lokaal of cloud):
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/seed-demo.mjs
 *
 * Of zet SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env (niet committen).
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvFile() {
  const path = resolve(root, '.env')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const key = t.slice(0, i).trim()
    const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvFile()

const BASE_URL =
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  'http://127.0.0.1:54321'
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_KEY) {
  console.error(`
❌ SUPABASE_SERVICE_ROLE_KEY ontbreekt.

1. Supabase Dashboard → Project Settings → API
2. Kopieer de "service_role" key (secret!)
3. Run:

   set SUPABASE_URL=https://JOUW-PROJECT.supabase.co
   set SUPABASE_SERVICE_ROLE_KEY=eyJ...
   node scripts/seed-demo.mjs
`)
  process.exit(1)
}

const PASSWORD = process.env.SEED_PASSWORD ?? 'ShiftSyncDemo123!'
const YEAR = new Date().getFullYear()
const MONTH = new Date().getMonth() + 1

const EMPLOYEES = [
  { email: 'lisa.vanberg@demo.shiftsync.nl', name: 'Lisa van Berg', position: 'Keuken', rate: 14.5, pattern: 'weekday_mornings' },
  { email: 'daan.mulder@demo.shiftsync.nl', name: 'Daan Mulder', position: 'Bezorging', rate: 13.75, pattern: 'evenings' },
  { email: 'sara.okonkwo@demo.shiftsync.nl', name: 'Sara Okonkwo', position: 'Bediening', rate: 15, pattern: 'weekends' },
  { email: 'tim.bos@demo.shiftsync.nl', name: 'Tim Bos', position: 'Keuken', rate: 14, pattern: 'flex' },
  { email: 'noor.ahmad@demo.shiftsync.nl', name: 'Noor Ahmad', position: 'Bediening', rate: 14.25, pattern: 'weekdays' },
  { email: 'rick.devries@demo.shiftsync.nl', name: 'Rick de Vries', position: 'Bezorging', rate: 13.5, pattern: 'evening_weekend' },
  { email: 'floor.jansen@demo.shiftsync.nl', name: 'Floor Jansen', position: 'Keuken', rate: 15.5, pattern: 'mornings' },
  { email: 'jay.patel@demo.shiftsync.nl', name: 'Jay Patel', position: 'Bediening', rate: 14.8, pattern: 'mixed' },
  { email: 'evi.smit@demo.shiftsync.nl', name: 'Evi Smit', position: 'Keuken', rate: 14, pattern: 'tue_thu' },
  { email: 'omar.elmansouri@demo.shiftsync.nl', name: 'Omar El Mansouri', position: 'Bezorging', rate: 13.9, pattern: 'full_week' },
]

const headers = (key) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
})

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers(SERVICE_KEY), ...options.headers },
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) throw new Error(typeof data === 'object' ? JSON.stringify(data) : text)
  return data
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function dateStr(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function dow(y, m, d) {
  return new Date(y, m - 1, d).getDay()
}

function rand(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function windowFor(pattern, day, seed) {
  const r = rand(seed)
  switch (pattern) {
    case 'weekday_mornings':
      return { from: '08:00', until: '14:00' }
    case 'evenings':
      return { from: '16:00', until: '22:00' }
    case 'weekends':
      return r < 0.5 ? { from: '10:00', until: '18:00' } : { from: '12:00', until: '22:00' }
    case 'flex':
      return r < 0.33 ? { from: '10:00', until: '18:00' } : r < 0.66 ? { from: '14:00', until: '22:00' } : null
    case 'weekdays':
      return { from: '09:00', until: '17:00' }
    case 'evening_weekend':
      return r < 0.4 ? { from: '17:00', until: '23:00' } : { from: '11:00', until: '19:00' }
    case 'mornings':
      return { from: '07:00', until: '13:00' }
    case 'mixed':
      return r < 0.5 ? { from: '11:00', until: '19:00' } : { from: '15:00', until: '21:00' }
    case 'tue_thu':
      return { from: '10:00', until: '16:00' }
    case 'full_week':
      return { from: '09:00', until: '21:00' }
    default:
      return null
  }
}

function availableOn(pattern, dayDow, day, seed) {
  const r = rand(seed + day)
  switch (pattern) {
    case 'weekday_mornings':
    case 'weekdays':
    case 'mornings':
      return dayDow >= 1 && dayDow <= 5 && r < 0.85
    case 'evenings':
      return dayDow >= 1 && dayDow <= 6 && r < 0.7
    case 'weekends':
      return (dayDow === 0 || dayDow === 6) && r < 0.9
    case 'evening_weekend':
      return (dayDow === 0 || dayDow === 5 || dayDow === 6 || dayDow >= 1) && r < 0.65
    case 'tue_thu':
      return (dayDow === 2 || dayDow === 3 || dayDow === 4) && r < 0.9
    case 'full_week':
      return r < 0.8
    case 'flex':
      return r < 0.5
    case 'mixed':
      return r < 0.55
    default:
      return r < 0.6
  }
}

async function getOrganizationId() {
  if (process.env.ORGANIZATION_ID) return process.env.ORGANIZATION_ID
  const orgs = await api('/rest/v1/organizations?select=id,name&limit=1')
  if (orgs?.[0]?.id) return orgs[0].id
  const admins = await api('/rest/v1/users?role=eq.admin&select=organization_id&limit=1')
  const id = admins?.[0]?.organization_id
  if (!id) throw new Error('Geen organization_id gevonden. Maak eerst een account/org aan.')
  return id
}

async function ensureUser(emp, orgId) {
  const existing = await api(
    `/rest/v1/users?email=eq.${encodeURIComponent(emp.email)}&select=id,organization_id`,
  )
  if (existing?.[0]?.id) {
    await api(`/rest/v1/users?id=eq.${existing[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        organization_id: orgId,
        primary_position: emp.position,
        hourly_rate: emp.rate,
        role: 'employee',
        full_name: emp.name,
      }),
    })
    return existing[0].id
  }

  const created = await api('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: emp.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: emp.name, role: 'employee' },
    }),
  })
  const id = created.user?.id ?? created.id
  if (!id) throw new Error(`Kon user niet aanmaken: ${emp.email}`)

  await api(`/rest/v1/users?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      organization_id: orgId,
      primary_position: emp.position,
      hourly_rate: emp.rate,
    }),
  })
  return id
}

async function insertBatch(table, rows, onConflict) {
  if (!rows.length) return
  const qs = onConflict ? `?on_conflict=${onConflict}` : ''
  const batchSize = 40
  for (let i = 0; i < rows.length; i += batchSize) {
    await api(`/rest/v1/${table}${qs}`, {
      method: 'POST',
      headers: { Prefer: onConflict ? 'resolution=merge-duplicates' : 'return=minimal' },
      body: JSON.stringify(rows.slice(i, i + batchSize)),
    })
  }
}

async function main() {
  console.log(`ShiftSync demo seed → ${BASE_URL}\n`)

  const orgId = await getOrganizationId()
  console.log(`Organisatie: ${orgId}\n`)

  const userIds = []
  for (const emp of EMPLOYEES) {
    try {
      const id = await ensureUser(emp, orgId)
      userIds.push({ ...emp, id })
      console.log(`✓ ${emp.name} (${emp.position})`)
    } catch (e) {
      console.log(`✗ ${emp.name}: ${e.message}`)
    }
  }

  if (userIds.length === 0) {
    console.error('\nGeen medewerkers aangemaakt.')
    process.exit(1)
  }

  const days = daysInMonth(YEAR, MONTH)
  const availability = []
  for (const emp of userIds) {
    const seed = emp.email.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    for (let d = 1; d <= days; d++) {
      const dayDow = dow(YEAR, MONTH, d)
      if (!availableOn(emp.pattern, dayDow, d, seed)) continue
      const w = windowFor(emp.pattern, d, seed + d)
      availability.push({
        organization_id: orgId,
        user_id: emp.id,
        date: dateStr(YEAR, MONTH, d),
        available_from: w?.from ?? null,
        available_until: w?.until ?? null,
        note: w ? null : 'Hele dag beschikbaar',
      })
    }
  }
  await insertBatch('availability', availability, 'user_id,date')
  console.log(`\n→ ${availability.length} beschikbaarheidsregels (${MONTH}/${YEAR})`)

  const today = new Date()
  const todayStr = dateStr(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const addDays = (n) => {
    const d = new Date(today)
    d.setDate(d.getDate() + n)
    return dateStr(d.getFullYear(), d.getMonth() + 1, d.getDate())
  }

  const leaveRows = [
    { user_id: userIds[0].id, start_date: addDays(14), end_date: addDays(18), reason: 'Vakantie naar Spanje', status: 'pending' },
    { user_id: userIds[2].id, start_date: addDays(7), end_date: addDays(9), reason: 'Familiebezoek', status: 'pending' },
    { user_id: userIds[5].id, start_date: addDays(21), end_date: addDays(25), reason: 'Studie-examenweek', status: 'pending' },
    { user_id: userIds[1].id, start_date: addDays(-10), end_date: addDays(-7), reason: 'Korte break', status: 'approved' },
    { user_id: userIds[7].id, start_date: addDays(30), end_date: addDays(32), reason: 'Concert in Amsterdam', status: 'rejected', manager_note: 'Te druk weekend, kies andere datum.' },
  ].map((r) => ({ ...r, organization_id: orgId }))

  await insertBatch('leave_requests', leaveRows)
  console.log(`→ ${leaveRows.length} verlofaanvragen (3 open, 1 goedgekeurd, 1 afgewezen)`)

  const sickRows = [
    { organization_id: orgId, user_id: userIds[3].id, start_date: todayStr, end_date: null, note: 'Griep — thuis rusten', status: 'active' },
    { organization_id: orgId, user_id: userIds[8].id, start_date: addDays(-1), end_date: null, note: 'Keelpijn', status: 'active' },
    { organization_id: orgId, user_id: userIds[4].id, start_date: addDays(-14), end_date: addDays(-12), note: 'Hersteld', status: 'resolved' },
  ]
  await insertBatch('sick_reports', sickRows)
  console.log(`→ ${sickRows.length} ziekmeldingen (2 actief, 1 afgerond)`)

  const shiftRows = [
    { organization_id: orgId, user_id: userIds[0].id, date: todayStr, start_time: '09:00', end_time: '17:00', position: 'Keuken', status: 'scheduled', published: true, slot_index: 0 },
    { organization_id: orgId, user_id: userIds[1].id, date: todayStr, start_time: '17:00', end_time: '22:00', position: 'Bezorging', status: 'scheduled', published: true, slot_index: 0 },
    { organization_id: orgId, user_id: userIds[2].id, date: addDays(1), start_time: '11:00', end_time: '19:00', position: 'Bediening', status: 'scheduled', published: true, slot_index: 0 },
    { organization_id: orgId, user_id: null, date: addDays(1), start_time: '12:00', end_time: '20:00', position: 'Keuken', status: 'scheduled', published: true, slot_index: 1 },
    { organization_id: orgId, user_id: userIds[6].id, date: addDays(2), start_time: '08:00', end_time: '14:00', position: 'Keuken', status: 'scheduled', published: false, slot_index: 0 },
    { organization_id: orgId, user_id: userIds[9].id, date: addDays(3), start_time: '16:00', end_time: '22:00', position: 'Bezorging', status: 'scheduled', published: true, slot_index: 0 },
  ]

  const createdShifts = await api('/rest/v1/shifts', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(shiftRows),
  })
  console.log(`→ ${createdShifts.length} diensten (incl. 1 open dienst)`)

  const openShift = createdShifts.find((s) => !s.user_id)
  const swapShift = createdShifts.find((s) => s.user_id === userIds[9].id)
  const swapRows = []
  if (openShift) {
    swapRows.push({
      organization_id: orgId,
      shift_id: openShift.id,
      offered_by: userIds[2].id,
      accepted_by: null,
      status: 'offered',
    })
  }
  if (swapShift) {
    swapRows.push({
      organization_id: orgId,
      shift_id: swapShift.id,
      offered_by: userIds[9].id,
      accepted_by: userIds[1].id,
      status: 'accepted',
    })
  }
  if (swapRows.length) {
    await insertBatch('shift_swaps', swapRows)
    console.log(`→ ${swapRows.length} dienstruil-verzoeken`)
  }

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 2)
  const clockIn = weekAgo.toISOString()
  const clockOut = new Date(weekAgo.getTime() + 7.5 * 3600000).toISOString()
  const clockRows = [
    {
      organization_id: orgId,
      user_id: userIds[0].id,
      clock_in: clockIn,
      clock_out: clockOut,
      total_hours: 7.5,
      approved: true,
    },
    {
      organization_id: orgId,
      user_id: userIds[1].id,
      clock_in: new Date(today.getTime() - 3 * 3600000).toISOString(),
      clock_out: null,
      total_hours: null,
      approved: false,
    },
  ]
  await insertBatch('clock_records', clockRows)
  console.log('→ 2 klokregistraties (1 afgerond + goedgekeurd, 1 actief ingeklokt)')

  const admins = await api('/rest/v1/users?role=eq.admin&select=id&limit=1')
  const adminId = admins?.[0]?.id
  const notifRows = userIds.slice(0, 3).flatMap((emp, i) => [
    {
      organization_id: orgId,
      user_id: emp.id,
      type: 'info',
      title: 'Welkom bij ShiftSync demo',
      body: 'Je demo-account is klaar. Bekijk je rooster en beschikbaarheid.',
      link: '/app/dashboard',
    },
    ...(adminId
      ? [{
          organization_id: orgId,
          user_id: adminId,
          type: 'leave_requested',
          title: `Verlof: ${emp.name}`,
          body: 'Nieuwe demo-verlofaanvraag ter beoordeling.',
          link: '/app/verlof',
        }]
      : []),
  ]).slice(0, 8)

  try {
    await insertBatch('notifications', notifRows)
    console.log(`→ ${notifRows.length} in-app meldingen`)
  } catch {
    console.log('→ meldingen overgeslagen (voer pro_features migratie uit)')
  }

  console.log('\n════════════════════════════════════════')
  console.log('KLAAR — demo-data staat in de database')
  console.log('════════════════════════════════════════')
  console.log(`\nWachtwoord alle demo-medewerkers: ${PASSWORD}`)
  console.log('\nMedewerkers:')
  for (const e of userIds) {
    console.log(`  • ${e.name} — ${e.email} (${e.position}, ${e.pattern})`)
  }
  console.log('\nTest als manager: log in met je admin-account en bekijk')
  console.log('  Dashboard · Rooster · Verlof · Ziek · Ruilen · Klok · Uren · Beschikbaarheid')
}

main().catch((e) => {
  console.error('\nFout:', e.message)
  process.exit(1)
})
