// Numbers always use Indian grouping with Latin digits, which farmers read on price boards
const wholeRupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const exactRupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })

const numberFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

/** ₹1,240 for whole amounts, ₹136.40 when there are paise */
export function rupees(amount) {
  const value = Number(amount) || 0
  return (Number.isInteger(value) ? wholeRupees : exactRupees).format(value)
}
export const number = (value) => numberFormat.format(Number(value) || 0)

const locale = (lang) => (lang === 'ml' ? 'ml-IN' : 'en-IN')

export function formatDate(value, lang, options = { day: 'numeric', month: 'short' }) {
  if (!value) return ''
  // Plain "YYYY-MM-DD" strings are local dates, not UTC midnight
  const date = typeof value === 'string' && value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value)
  return new Intl.DateTimeFormat(locale(lang), options).format(date)
}

export function formatDateTime(value, lang) {
  return formatDate(value, lang, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export function formatLongDate(value, lang) {
  return formatDate(value, lang, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** "YYYY-MM-DD" for today in local time, plus an offset in days */
export function isoDate(daysFromToday = 0) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  return date.toLocaleDateString('en-CA')
}

/** "5 minutes ago", "yesterday": in the reader's language, and a plain date once it is over a week old */
export function timeAgo(value, lang) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  if (Math.abs(seconds) > 7 * 24 * 3600) return formatDate(value, lang, { day: 'numeric', month: 'short' })
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' })
  for (const [unit, size] of [['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return rtf.format(0, 'second')
}
