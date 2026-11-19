import { number } from './format'
import { produceName } from './produce'

const kgOf = (item, lang) => `${number(item.quantity)} kg ${produceName(item.produce_name, lang)}`

/** "2 kg Carrot, 3 kg Cabbage": every item of an order, for sentences and dialogs */
export const itemsText = (order, lang) => order.items.map((item) => kgOf(item, lang)).join(', ')

/** "Carrot, Cabbage": just the names */
export const produceNames = (order, lang) => order.items.map((item) => produceName(item.produce_name, lang)).join(', ')

/** Card heading: "6 kg Tomato" for one item, "3 items · 8 kg" for several */
export function orderTitle(order, lang, t) {
  if (order.items.length === 1) return kgOf(order.items[0], lang)
  return t('orderItems.title', { count: order.items.length, kg: number(order.total_kg) })
}
