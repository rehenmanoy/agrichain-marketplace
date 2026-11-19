import {
  AvocadoIcon,
  CarrotIcon,
  CherriesIcon,
  GrainsIcon,
  LeafIcon,
  OrangeIcon,
  OrangeSliceIcon,
  PepperIcon,
  PlantIcon,
} from '@phosphor-icons/react'

// Malayalam names for every item on the market price site (keys are the English names, lower case)
const MALAYALAM = {
  'onion big': 'സവാള',
  'onion small': 'ചെറിയ ഉള്ളി',
  tomato: 'തക്കാളി',
  'green chilli': 'പച്ചമുളക്',
  beetroot: 'ബീറ്റ്റൂട്ട്',
  potato: 'ഉരുളക്കിഴങ്ങ്',
  'raw banana (plantain)': 'പച്ചക്കായ',
  'amaranth leaves': 'ചീര',
  amla: 'നെല്ലിക്ക',
  'ash gourd': 'കുമ്പളങ്ങ',
  'baby corn': 'ബേബി കോൺ',
  'banana flower': 'വാഴക്കൂമ്പ്',
  capsicum: 'കാപ്സിക്കം',
  'bitter gourd': 'പാവയ്ക്ക',
  'bottle gourd': 'ചുരയ്ക്ക',
  'butter beans': 'ബട്ടർ ബീൻസ്',
  'broad beans': 'അമരയ്ക്ക',
  cabbage: 'കാബേജ്',
  carrot: 'കാരറ്റ്',
  cauliflower: 'കോളിഫ്ലവർ',
  'cluster beans': 'കൊത്തമര',
  coconut: 'തേങ്ങ',
  'colocasia leaves': 'ചേമ്പില',
  colocasia: 'ചേമ്പ്',
  'coriander leaves': 'മല്ലിയില',
  corn: 'ചോളം',
  cucumber: 'വെള്ളരിക്ക',
  'curry leaves': 'കറിവേപ്പില',
  'dill leaves': 'ചതകുപ്പ',
  drumsticks: 'മുരിങ്ങക്കായ',
  brinjal: 'വഴുതനങ്ങ',
  'brinjal (big)': 'വലിയ വഴുതനങ്ങ',
  'elephant yam': 'ചേന',
  'fenugreek leaves': 'ഉലുവയില',
  'french beans': 'ബീൻസ്',
  garlic: 'വെളുത്തുള്ളി',
  ginger: 'ഇഞ്ചി',
  'onion green': 'ഉള്ളിത്തണ്ട്',
  'green peas': 'ഗ്രീൻ പീസ്',
  'ivy gourd': 'കോവയ്ക്ക',
  'lemon (lime)': 'ചെറുനാരങ്ങ',
  'mango raw': 'പച്ചമാങ്ങ',
  'mint leaves': 'പുതിനയില',
  mushroom: 'കൂൺ',
  'mustard leaves': 'കടുകില',
  'ladies finger': 'വെണ്ടയ്ക്ക',
  pumpkin: 'മത്തങ്ങ',
  radish: 'മുള്ളങ്കി',
  'ridge gourd': 'പീച്ചിങ്ങ',
  'shallot (pearl onion)': 'ചുവന്നുള്ളി',
  'snake gourd': 'പടവലങ്ങ',
  'sorrel leaves': 'പുളിച്ചക്കീര',
  spinach: 'പാലക് ചീര',
  'sweet potato': 'മധുരക്കിഴങ്ങ്',
  'apple washington': 'വാഷിംഗ്ടൺ ആപ്പിൾ',
  'apple shimla': 'ഷിംല ആപ്പിൾ',
  'apple green': 'പച്ച ആപ്പിൾ',
  apricot: 'ആപ്രിക്കോട്ട്',
  avocado: 'അവക്കാഡോ',
  'banana morris': 'മോറിസ് പഴം',
  banana: 'വാഴപ്പഴം',
  'banana poovam': 'പൂവൻ പഴം',
  cantaloupe: 'ഷമാം',
  'custard apple': 'സീതപ്പഴം',
  gooseberry: 'നെല്ലിക്ക',
  'grapes black': 'കറുത്ത മുന്തിരി',
  'grapes green': 'പച്ച മുന്തിരി',
  guava: 'പേരയ്ക്ക',
  jackfruit: 'ചക്ക',
  lychee: 'ലിച്ചി',
  mango: 'മാമ്പഴം',
  orange: 'ഓറഞ്ച്',
  papaya: 'പപ്പായ',
  pears: 'പിയർ',
  pineapple: 'കൈതച്ചക്ക',
  'pomegranate kabul': 'മാതളനാരങ്ങ',
  sapota: 'സപ്പോട്ട',
  'sugar cane': 'കരിമ്പ്',
  'sweet lime(mosumbi)': 'മുസമ്പി',
  watermelon: 'തണ്ണിമത്തൻ',
}

/** The items shown first when choosing produce, most traded in Kerala first */
export const COMMON_PRODUCE = {
  VEGETABLE: ['Tomato', 'Onion Big', 'Potato', 'Green Chilli', 'Carrot', 'Cabbage', 'Brinjal', 'Ladies Finger'],
  FRUIT: ['Banana', 'Mango', 'Pineapple', 'Papaya', 'Jackfruit', 'Guava', 'Orange', 'Watermelon'],
}

const key = (name) => String(name ?? '').trim().toLowerCase()

// Icon chosen from words in the name; the name is always shown next to it
const ICON_RULES = [
  [/leaves|spinach|cabbage|amaranth/, LeafIcon],
  [/chilli|capsicum/, PepperIcon],
  [/carrot|radish|beetroot|potato|yam|colocasia/, CarrotIcon],
  [/corn|beans|peas|drumstick/, GrainsIcon],
  [/grapes|lychee|cherr/, CherriesIcon],
  [/avocado|papaya|pears|mango/, AvocadoIcon],
  [/orange|lime|lemon|melon|cantaloupe/, OrangeSliceIcon],
]

export function produceIcon(name, category) {
  const k = key(name)
  const match = ICON_RULES.find(([pattern]) => pattern.test(k))
  if (match) return match[1]
  return category === 'FRUIT' ? OrangeIcon : PlantIcon
}

/** Produce name in the current language (falls back to the English name) */
export function produceName(name, lang) {
  return (lang === 'ml' && MALAYALAM[key(name)]) || name
}

/** The other language's name, shown as a second line */
export function produceAltName(name, lang) {
  if (lang === 'ml') return name
  return MALAYALAM[key(name)] ?? ''
}

/** True if the search text matches the English or Malayalam name */
export function matchesProduce(item, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return key(item.name).includes(q) || (MALAYALAM[key(item.name)] ?? '').includes(q)
}
