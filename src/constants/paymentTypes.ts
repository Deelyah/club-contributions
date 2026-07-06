// The fixed set of payment types a payment can be assigned. Used by the Add/Edit
// Payment dropdown; the payment table just displays whatever is stored.
export const PAYMENT_TYPES = [
  'Annual Dues',
  'Monthly Kitty',
  'Mid-Week Kitty',
  'Tournament',
  "Founder's Kitty",
  'Hole unveiling',
  'Project Levy',
  'Membership Registration',
  'Admission Form',
  'Redemption of pledge',
  'Others',
] as const

export type PaymentType = (typeof PAYMENT_TYPES)[number]
