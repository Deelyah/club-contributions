// Mock backend — no server required. All data lives in memory (seeded from
// ./mockData) and resets on page reload, so mutations like adding a payment
// persist for the session but not across refreshes. The exported api objects
// keep the exact shapes the components expect ({ data } responses, errors
// shaped like axios's e.response.data.error), so nothing else needs to change.

import {
  seedUsers,
  seedPayments,
  seedAudit,
  seedDues,
  type MockUser,
  type MockPayment,
  type MockAudit,
  type MockDues,
} from './mockData'

// ---- In-memory store (stands in for the database) ----
const db = {
  users: structuredClone(seedUsers) as MockUser[],
  payments: structuredClone(seedPayments) as MockPayment[],
  audit: structuredClone(seedAudit) as MockAudit[],
  dues: structuredClone(seedDues) as MockDues,
}
let auditSeq = db.audit.length

// ---- Helpers ----
const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Math.random().toString(36).slice(2)

const nowIso = () => new Date().toISOString()
const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

// Wrap a value like an axios response, with a touch of latency for realism.
async function ok<T>(data: T): Promise<{ data: T }> {
  await delay()
  return { data }
}

// Throw an axios-shaped error so `e.response?.data?.error` keeps working.
function fail(error: string, status = 400): never {
  throw { response: { data: { error }, status } }
}

// The token encodes the user id so the current user survives a page reload.
function currentUserId(): string | null {
  const t = localStorage.getItem('token')
  return t && t.startsWith('mock.') ? t.slice(5) : null
}

function currentUser(): MockUser | undefined {
  const id = currentUserId()
  return id ? db.users.find((u) => u.id === id) : undefined
}

function publicUser(u: MockUser) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    profile_picture: u.profile_picture,
    created_at: u.created_at,
  }
}

function addAudit(action: string, member: MockUser | null, details: Record<string, unknown> | null) {
  db.audit.unshift({
    id: ++auditSeq,
    admin_username: currentUser()?.username ?? 'admin',
    member_username: member?.username ?? null,
    member_id: member?.id ?? null,
    action,
    details: details ? JSON.stringify(details) : null,
    created_at: nowIso(),
  })
}

// Stub kept only so the auth store's header assignments stay harmless no-ops.
export const api = { defaults: { headers: { common: {} as Record<string, string> } } }

// ---- Auth ----
export const authApi = {
  register: (d: { username: string; email: string; password: string }) => {
    const username = d.username.trim()
    const email = d.email.trim().toLowerCase()
    if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase() || u.email === email)) {
      return fail('Username or email already taken')
    }
    const user: MockUser = {
      id: uid(),
      username,
      email,
      password: d.password,
      role: 'member',
      profile_picture: null,
      created_at: nowIso(),
    }
    db.users.push(user)
    return ok({ token: `mock.${user.id}`, user: publicUser(user) })
  },

  login: (d: { username: string; password: string }) => {
    const key = d.username.trim().toLowerCase()
    const user = db.users.find(
      (u) => u.username.toLowerCase() === key || u.email.toLowerCase() === key,
    )
    if (!user || user.password !== d.password) return fail('Invalid username or password', 401)
    return ok({ token: `mock.${user.id}`, user: publicUser(user) })
  },

  me: () => {
    const u = currentUser()
    if (!u) return fail('Not authenticated', 401)
    return ok(publicUser(u))
  },
}

// ---- Members ----
export const membersApi = {
  list: (search?: string) => {
    const q = search?.trim().toLowerCase()
    const members = db.users
      .filter((u) => u.role === 'member')
      .filter(
        (u) => !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      )
      .map(publicUser)
    return ok(members)
  },

  get: (id: string) => {
    const u = db.users.find((x) => x.id === id && x.role === 'member')
    if (!u) return fail('Member not found', 404)
    return ok(publicUser(u))
  },

  uploadProfilePicture: (id: string, file: File) => {
    const url = URL.createObjectURL(file)
    const u = db.users.find((x) => x.id === id)
    if (u) u.profile_picture = url
    return ok({ profile_picture: url })
  },
}

// ---- Payments ----
function paymentFromForm(fd: FormData, existing?: MockPayment): MockPayment {
  const get = (k: string) => {
    const v = fd.get(k)
    return v == null || v instanceof File ? undefined : String(v)
  }
  const receipt = fd.get('receipt')
  const receipt_path =
    receipt instanceof File && receipt.size > 0
      ? URL.createObjectURL(receipt)
      : existing?.receipt_path ?? null

  const due_amount = get('due_amount')
  const amount_paid = get('amount_paid')

  return {
    id: existing?.id ?? uid(),
    member_id: get('member_id') ?? existing?.member_id ?? '',
    period_label: get('period_label') ?? existing?.period_label ?? '',
    payment_date: get('payment_date') ?? existing?.payment_date ?? '',
    due_amount: due_amount != null ? parseFloat(due_amount) : existing?.due_amount ?? 0,
    amount_paid: amount_paid != null ? parseFloat(amount_paid) || 0 : existing?.amount_paid ?? 0,
    receipt_path,
    notes: get('notes') ?? existing?.notes ?? null,
    created_by_username: existing?.created_by_username ?? currentUser()?.username ?? 'admin',
    created_at: existing?.created_at ?? nowIso(),
    updated_at: nowIso(),
  }
}

export const paymentsApi = {
  getMy: () => {
    const id = currentUserId()
    return ok(db.payments.filter((p) => p.member_id === id))
  },

  getByMember: (memberId: string) => ok(db.payments.filter((p) => p.member_id === memberId)),

  add: (data: FormData) => {
    const payment = paymentFromForm(data)
    if (!payment.member_id || !payment.period_label || !payment.payment_date || !payment.due_amount) {
      return fail('member_id, period_label, payment_date, and due_amount are required')
    }
    db.payments.push(payment)
    const member = db.users.find((u) => u.id === payment.member_id) ?? null
    addAudit('ADD_PAYMENT', member, {
      period_label: payment.period_label,
      amount_paid: payment.amount_paid,
      payment_date: payment.payment_date,
    })
    return ok(payment)
  },

  update: (id: string, data: FormData) => {
    const existing = db.payments.find((p) => p.id === id)
    if (!existing) return fail('Payment not found', 404)
    const updated = paymentFromForm(data, existing)
    Object.assign(existing, updated)
    const member = db.users.find((u) => u.id === existing.member_id) ?? null
    addAudit('UPDATE_PAYMENT', member, {
      payment_id: id,
      period_label: existing.period_label,
      amount_paid: existing.amount_paid,
    })
    return ok(existing)
  },
}

// ---- Dues ----
export const duesApi = {
  get: () => ok(db.dues),

  set: (d: { amount: number; frequency: string; start_date: string }) => {
    db.dues = { amount: d.amount, frequency: d.frequency, start_date: d.start_date }
    addAudit('UPDATE_DUES_CONFIG', null, { amount: d.amount, frequency: d.frequency })
    return ok(db.dues)
  },
}

// ---- Audit ----
export const auditApi = {
  get: (memberId?: string) => {
    const logs = memberId ? db.audit.filter((a) => a.member_id === memberId) : db.audit
    return ok([...logs].sort((a, b) => b.id - a.id))
  },
}
