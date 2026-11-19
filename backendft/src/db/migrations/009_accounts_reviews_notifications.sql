-- 009: Account basics (password change and reset), ratings for delivery partners and warehouses,
-- produce types added by farmers, and in-app notifications. Nothing existing is changed.

-- Logins issued before this moment can no longer be renewed after a password change or reset
ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMPTZ;

-- One-time codes for "forgot password" (only a hash of the code is kept)
CREATE TABLE password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash  TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_resets_user ON password_resets(user_id, created_at DESC);

-- Produce added by a farmer has no market price, so the fair-price band does not apply to it
ALTER TABLE produce ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE produce ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- A buyer rates the delivery partner of a delivered order (once per order)
CREATE TABLE partner_reviews (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL UNIQUE REFERENCES orders(id),
  buyer_id   INTEGER NOT NULL REFERENCES users(id),
  partner_id INTEGER NOT NULL REFERENCES users(id),
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_partner_reviews_partner ON partner_reviews(partner_id);

-- A farmer rates a warehouse after taking the produce out (once per booking)
CREATE TABLE warehouse_reviews (
  id           SERIAL PRIMARY KEY,
  booking_id   INTEGER NOT NULL UNIQUE REFERENCES warehouse_bookings(id),
  farmer_id    INTEGER NOT NULL REFERENCES users(id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_warehouse_reviews_warehouse ON warehouse_reviews(warehouse_id);

-- In-app notifications. The text is not stored: the app writes it from the type and data,
-- in the reader's own language.
CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}',
  read_at    TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read_at, created_at DESC);
