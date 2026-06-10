/**
 * Maakt 10 medewerkers + maandbeschikbaarheid aan (lokale Supabase).
 * Gebruik: node scripts/seed-team.mjs
 */

const BASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const PASSWORD = 'OtoroTeam123!'
const YEAR = 2026
const MONTH = 6 // juni

const EMPLOYEES = [
  { email: 'yuki@otoro.nl', name: 'Yuki Tanaka', pattern: 'full_week' },
  { email: 'sofia@otoro.nl', name: 'Sofia de Vries', pattern: 'weekends' },
  { email: 'marco@otoro.nl', name: 'Marco Jansen', pattern: 'weekdays' },
  { email: 'lin@otoro.nl', name: 'Lin Wei', pattern: 'evenings' },
  { email: 'emma@otoro.nl', name: 'Emma Bakker', pattern: 'mornings' },
  { email: 'ahmed@otoro.nl', name: 'Ahmed Hassan', pattern: 'mixed' },
  { email: 'julia@otoro.nl', name: 'Julia Smit', pattern: 'tue_sat' },
  { email: 'kenji@otoro.nl', name: 'Kenji Yamamoto', pattern: 'full_week' },
  { email: 'fatima@otoro.nl', name: 'Fatima El Amrani', pattern: 'weekends' },
  { email: 'tom@otoro.nl', name: 'Tom de Groot', pattern: 'flex' },
]

const headers = (key) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
})

async function api(path, options = {}, service = false) {
  const key = service ? SERVICE_KEY : ANON_KEY
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers(key), ...options.headers },
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) throw new Error(JSON.stringify(data))
  return data
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function dateStr(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function dayOfWeek(year, month, day) {
  return new Date(year, month - 1, day).getDay() // 0=zo
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function isAvailableDay(pattern, dow, day, emailSeed) {
  const r = seededRandom(emailSeed + day * 17)
  switch (pattern) {
    case 'full_week':
      return r < 0.75
    case 'weekends':
      return (dow === 0 || dow === 6) && r < 0.9
    case 'weekdays':
      return dow >= 1 && dow <= 5 && r < 0.8
    case 'evenings':
      return dow >= 1 && dow <= 6 && r < 0.7
    case 'mornings':
      return dow >= 1 && dow <= 5 && r < 0.75
    case 'tue_sat':
      return (dow === 2 || dow === 3 || dow === 4 || dow === 5 || dow === 6) && r < 0.8
    case 'mixed':
      return r < 0.55
    case 'flex':
      return r < 0.45
    default:
      return r < 0.6
  }
}

function shiftWindow(pattern, dow, day, emailSeed) {
  const r = seededRandom(emailSeed + day * 31)
  if (pattern === 'evenings') return { from: '16:00', until: '22:00' }
  if (pattern === 'mornings') return { from: '09:00', until: '15:00' }
  if (pattern === 'weekends' && (dow === 0 || dow === 6)) {
    return r < 0.5 ? { from: '11:00', until: '21:00' } : { from: '12:00', until: '22:00' }
  }
  if (r < 0.33) return { from: '10:00', until: '18:00' }
  if (r < 0.66) return { from: '11:00', until: '20:00' }
  return { from: '12:00', until: '21:00' }
}

async function signupEmployee(email, name) {
  try {
    const data = await api('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: PASSWORD,
        data: { full_name: name, role: 'employee' },
      }),
    })
    return data.user?.id
  } catch (e) {
    if (String(e.message).includes('already') || String(e.message).includes('registered')) {
      const users = await api(
        `/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id`,
        {},
        true
      )
      return users[0]?.id
    }
    throw e
  }
}

async function main() {
  console.log('Otoro — 10 medewerkers + beschikbaarheid\n')

  const userIds = []
  for (const emp of EMPLOYEES) {
    try {
      const id = await signupEmployee(emp.email, emp.name)
      if (id) {
        userIds.push({ ...emp, id })
        console.log(`[OK] ${emp.name} (${emp.email})`)
      }
    } catch (e) {
      console.log(`[!!] ${emp.name}: ${e.message}`)
    }
  }

  const days = daysInMonth(YEAR, MONTH)
  const allAvailability = []

  for (const emp of userIds) {
    const emailSeed = emp.email.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    let count = 0
    for (let d = 1; d <= days; d++) {
      const dow = dayOfWeek(YEAR, MONTH, d)
      if (!isAvailableDay(emp.pattern, dow, d, emailSeed)) continue
      allAvailability.push({
        user_id: emp.id,
        date: dateStr(YEAR, MONTH, d),
        available_from: null,
        available_until: null,
        note: null,
      })
      count++
    }
    console.log(`     → ${count} dagen beschikbaar in juni`)
  }

  if (allAvailability.length === 0) {
    console.log('\nGeen beschikbaarheid om op te slaan.')
    return
  }

  // Upsert in batches
  const batchSize = 50
  for (let i = 0; i < allAvailability.length; i += batchSize) {
    const batch = allAvailability.slice(i, i + batchSize)
    await api('/rest/v1/availability?on_conflict=user_id,date', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(batch),
    }, true)
  }

  console.log(`\n[KLAAR] ${userIds.length} medewerkers, ${allAvailability.length} beschikbaarheidsregels (juni ${YEAR})`)
  console.log(`\nWachtwoord voor alle medewerkers: ${PASSWORD}`)
  console.log('Log in als manager om rooster te maken: manager@otoro.nl / OtoroAdmin123!')
}

main().catch((e) => {
  console.error('Fout:', e.message)
  console.error('Zorg dat Supabase draait: npx supabase start')
  process.exit(1)
})
