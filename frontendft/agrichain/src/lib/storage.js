import { isoDate } from './format'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Days from start to end counting both, like the backend bills them: 1 Nov to 15 Nov is 15 days */
export const inclusiveDays = (start, end) => Math.round((Date.parse(end) - Date.parse(start)) / MS_PER_DAY) + 1

/** Whole days from today to a "YYYY-MM-DD" date (negative when it is in the past) */
export const daysFromToday = (date) => Math.round((Date.parse(date) - Date.parse(isoDate(0))) / MS_PER_DAY)

/** Warehouses are priced per kg per day; cold stores quote per quintal (100 kg) per month, so owners can compare */
export const perQuintalPerMonth = (ratePerKgPerDay) => (Number(ratePerKgPerDay) || 0) * 100 * 30

// Limits that match the backend (WAREHOUSE_PHOTOS and MAX_BOOKING_DAYS in src/utils/constants.js)
export const PHOTOS = { MIN: 2, MAX: 5, MAX_BYTES: 5 * 1024 * 1024, TYPES: ['image/jpeg', 'image/png', 'image/webp'] }
export const MAX_BOOKING_DAYS = 365
