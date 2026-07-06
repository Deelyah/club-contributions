// Seed data for the mock backend. This is the "JSON" that stands in for the
// database — the mock API in ./index.ts clones these arrays into an in-memory
// store on load. Log in with any username below; member password is Member@123,
// admin password is Admin@1234.

export interface MockUser {
  id: string
  username: string
  email: string
  password: string
  role: 'admin' | 'member'
  profile_picture: string | null
  created_at: string
}

export interface MockPayment {
  id: string
  member_id: string
  payment_type: string
  payment_date: string
  due_amount: number
  amount_paid: number
  receipt_path: string | null
  narration: string | null
  created_by_username: string
  created_at: string
  updated_at: string
}

export interface MockAudit {
  id: number
  admin_username: string
  member_username: string | null
  member_id: string | null
  action: string
  details: string | null
  created_at: string
}

export interface MockDues {
  amount: number
  frequency: string
  start_date: string
}

const MEMBERS = [
  { id: 'u1', username: 'ada', email: 'ada@club.local', created_at: '2026-01-02T09:00:00.000Z' },
  { id: 'u2', username: 'bola', email: 'bola@club.local', created_at: '2026-01-03T10:15:00.000Z' },
  { id: 'u3', username: 'chidi', email: 'chidi@club.local', created_at: '2026-01-05T14:30:00.000Z' },
  { id: 'u4', username: 'ngozi', email: 'ngozi@club.local', created_at: '2026-02-01T08:45:00.000Z' },
  { id: 'u5', username: 'emeka', email: 'emeka@club.local', created_at: '2026-02-10T11:20:00.000Z' },
  { id: 'u6', username: 'zainab', email: 'zainab@club.local', created_at: '2026-03-01T16:05:00.000Z' },
]

export const seedUsers: MockUser[] = [
  {
    id: 'u-admin',
    username: 'admin',
    email: 'admin@club.local',
    password: 'Admin@1234',
    role: 'admin',
    profile_picture: null,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  ...MEMBERS.map((m) => ({
    ...m,
    password: 'Member@123',
    role: 'member' as const,
    profile_picture: null,
  })),
]

const MONTHS = [
  { label: 'January 2026', date: '2026-01-05' },
  { label: 'February 2026', date: '2026-02-04' },
  { label: 'March 2026', date: '2026-03-06' },
  { label: 'April 2026', date: '2026-04-03' },
  { label: 'May 2026', date: '2026-05-05' },
  { label: 'June 2026', date: '2026-06-04' },
]

const DUE = 5000

// A payment type per month index, so the seeded rows show some variety.
const TYPE_BY_MONTH = [
  'Monthly Kitty',
  'Annual Dues',
  'Mid-Week Kitty',
  'Tournament',
  'Monthly Kitty',
  "Founder's Kitty",
]

// amount_paid per member (rows align with MEMBERS), one entry per MONTHS index.
// Mix of paid (5000), partial (<5000), unpaid (0) and credit/overpaid (>5000).
const PATTERNS: number[][] = [
  [5000, 5000, 5000, 3000, 0, 5000],
  [5000, 5000, 5000, 5000, 5000, 6000],
  [5000, 2500, 0, 5000, 5000, 0],
  [5000, 5000, 5000, 5000, 0, 0],
  [0, 5000, 5000, 2000, 5000, 5000],
  [5000, 5000, 5000, 5000, 5000, 5000],
]

export const seedPayments: MockPayment[] = MEMBERS.flatMap((member, i) =>
  MONTHS.map((month, m) => {
    const amount_paid = PATTERNS[i][m]
    return {
      id: `p-${member.id}-${m}`,
      member_id: member.id,
      payment_type: TYPE_BY_MONTH[m],
      payment_date: month.date,
      due_amount: DUE,
      amount_paid,
      receipt_path: null,
      narration:
        amount_paid === 0
          ? 'Payment outstanding — awaiting confirmation.'
          : `${TYPE_BY_MONTH[m]} contribution for ${month.label}.`,
      created_by_username: 'admin',
      created_at: `${month.date}T09:00:00.000Z`,
      updated_at: `${month.date}T09:00:00.000Z`,
    }
  }),
)

export const seedAudit: MockAudit[] = [
  {
    id: 1,
    admin_username: 'admin',
    member_username: 'ada',
    member_id: 'u1',
    action: 'ADD_PAYMENT',
    details: JSON.stringify({ payment_type: "Founder's Kitty", amount_paid: 5000, payment_date: '2026-06-04' }),
    created_at: '2026-06-04T09:00:00.000Z',
  },
  {
    id: 2,
    admin_username: 'admin',
    member_username: 'chidi',
    member_id: 'u3',
    action: 'UPDATE_PAYMENT',
    details: JSON.stringify({ payment_type: 'Annual Dues', amount_paid: 2500 }),
    created_at: '2026-05-20T13:30:00.000Z',
  },
  {
    id: 3,
    admin_username: 'admin',
    member_username: null,
    member_id: null,
    action: 'UPDATE_DUES_CONFIG',
    details: JSON.stringify({ amount: 5000, frequency: 'monthly' }),
    created_at: '2026-01-01T08:00:00.000Z',
  },
]

export const seedDues: MockDues = {
  amount: 5000,
  frequency: 'monthly',
  start_date: '2026-01-01',
}
