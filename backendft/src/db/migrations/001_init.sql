-- 001: Initial AgriChain schema.
-- Mirrors the schema the project was first built on. Every statement uses IF NOT EXISTS,
-- so running it against a database that already has these tables changes nothing.

CREATE TABLE IF NOT EXISTS regions (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL CHECK (role IN ('FARMER', 'BUYER', 'WAREHOUSE_OWNER')),
  base_location TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  region_id     INTEGER REFERENCES regions(id)
);

CREATE TABLE IF NOT EXISTS produce (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL UNIQUE,
  category TEXT CHECK (category IN ('VEGETABLE', 'FRUIT')),
  unit     TEXT DEFAULT 'kg'
);

CREATE TABLE IF NOT EXISTS price_history (
  id           SERIAL PRIMARY KEY,
  produce_id   INTEGER REFERENCES produce(id) ON DELETE CASCADE,
  market_price NUMERIC NOT NULL,
  date         DATE DEFAULT CURRENT_DATE,
  UNIQUE (produce_id, date)
);

CREATE TABLE IF NOT EXISTS listings (
  id            SERIAL PRIMARY KEY,
  farmer_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  produce_id    INTEGER REFERENCES produce(id),
  available_qty INTEGER NOT NULL,
  listing_price INTEGER NOT NULL,
  price_source  TEXT DEFAULT 'SCRAPED',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id          SERIAL PRIMARY KEY,
  buyer_id    INTEGER NOT NULL REFERENCES users(id),
  listing_id  INTEGER NOT NULL REFERENCES listings(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  status      TEXT NOT NULL DEFAULT 'PENDING',
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouses (
  id                    SERIAL PRIMARY KEY,
  owner_id              INTEGER NOT NULL REFERENCES users(id),
  region_id             INTEGER NOT NULL REFERENCES regions(id),
  name                  TEXT NOT NULL,
  location              TEXT NOT NULL,
  total_capacity_kg     NUMERIC NOT NULL CHECK (total_capacity_kg > 0),
  available_capacity_kg NUMERIC NOT NULL CHECK (available_capacity_kg >= 0),
  price_per_kg_per_day  NUMERIC NOT NULL CHECK (price_per_kg_per_day >= 0),
  is_cold_storage       BOOLEAN DEFAULT FALSE,
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouse_bookings (
  id            SERIAL PRIMARY KEY,
  warehouse_id  INTEGER NOT NULL REFERENCES warehouses(id),
  farmer_id     INTEGER NOT NULL REFERENCES users(id),
  produce_id    INTEGER REFERENCES produce(id),
  quantity_kg   NUMERIC NOT NULL CHECK (quantity_kg > 0),
  start_date    DATE DEFAULT CURRENT_DATE,
  end_date      DATE,
  status        TEXT DEFAULT 'ACTIVE',
  created_at    TIMESTAMP DEFAULT NOW(),
  amount_to_pay NUMERIC
);
