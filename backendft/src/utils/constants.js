export const ROLES = Object.freeze({
  FARMER: "FARMER",
  BUYER: "BUYER",
  WAREHOUSE_OWNER: "WAREHOUSE_OWNER",
  DELIVERY_PARTNER: "DELIVERY_PARTNER",
});

export const PRODUCE_CATEGORIES = ["VEGETABLE", "FRUIT"];

// Farmers may price a listing up to 20% above or below today's market rate
export const PRICE_BAND = 0.2;

// Delivery fee = BASE + PER_KG × quantity (₹)
export const DELIVERY_FEE = Object.freeze({ BASE: 20, PER_KG: 2 });

export const ORDER_STATUS = Object.freeze({
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
});

export const DELAY_REASONS = ["TRAFFIC", "VEHICLE", "WEATHER", "WAITING_AT_FARM", "OTHER"];

// REQUESTED: waiting for the owner. ACTIVE: approved (overdue is worked out from the dates).
// REJECTED: owner said no. CANCELLED: farmer withdrew. RELEASED: farmer took the produce out.
export const BOOKING_STATUS = Object.freeze({
  REQUESTED: "REQUESTED",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  RELEASED: "RELEASED",
});

export const EXTENSION_STATUS = Object.freeze({
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
});

// Every warehouse must show at least MIN photos so farmers can see it before booking
export const WAREHOUSE_PHOTOS = Object.freeze({ MIN: 2, MAX: 5, MAX_BYTES: 5 * 1024 * 1024 });

// A farmer can add at most this many produce types of their own (items not in the market list)
export const MAX_CUSTOM_PRODUCE_PER_FARMER = 10;

// What the notification bell can say. The app writes the sentence from the type and data, in the reader's language.
export const NOTIFICATION = Object.freeze({
  ORDER_NEW: "ORDER_NEW", // farmer: a buyer placed an order
  ORDER_ACCEPTED: "ORDER_ACCEPTED", // buyer: the farmer accepted
  ORDER_CANCELLED: "ORDER_CANCELLED", // the other side: cancelled by the buyer, or rejected by the farmer
  DELIVERY_WAITING: "DELIVERY_WAITING", // partners in the region: an order is ready to be taken
  ORDER_PICKED_UP: "ORDER_PICKED_UP", // buyer and farmer: a partner took it
  ORDER_DELAYED: "ORDER_DELAYED", // buyer and farmer: the partner reported a delay
  ORDER_DELIVERED: "ORDER_DELIVERED", // buyer and farmer
  REVIEW_NEW: "REVIEW_NEW", // farmer: a buyer rated them
  PARTNER_REVIEW_NEW: "PARTNER_REVIEW_NEW", // partner: a buyer rated the delivery
  WAREHOUSE_REVIEW_NEW: "WAREHOUSE_REVIEW_NEW", // owner: a farmer rated a warehouse
  BOOKING_REQUESTED: "BOOKING_REQUESTED", // owner: a farmer asked for space
  BOOKING_CANCELLED: "BOOKING_CANCELLED", // owner: the farmer withdrew
  BOOKING_RELEASED: "BOOKING_RELEASED", // owner: the farmer took the produce out
  EXTENSION_REQUESTED: "EXTENSION_REQUESTED", // owner: a farmer asked to extend
  BOOKING_APPROVED: "BOOKING_APPROVED", // farmer
  BOOKING_REJECTED: "BOOKING_REJECTED", // farmer
  EXTENSION_APPROVED: "EXTENSION_APPROVED", // farmer
  EXTENSION_REJECTED: "EXTENSION_REJECTED", // farmer
});

// One booking can't be longer than this many days (start to end, counting both)
export const MAX_BOOKING_DAYS = 365;
