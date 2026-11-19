-- 003: Delivery partners, delivery details on orders, and buyer reviews.

-- New role
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('FARMER', 'BUYER', 'WAREHOUSE_OWNER', 'DELIVERY_PARTNER'));

-- orders: where to deliver, what it costs, who delivers it and when
ALTER TABLE orders ADD COLUMN delivery_address TEXT;
UPDATE orders o
SET delivery_address = COALESCE(u.base_location, 'Not specified')
FROM users u
WHERE u.id = o.buyer_id AND o.delivery_address IS NULL;
ALTER TABLE orders ALTER COLUMN delivery_address SET NOT NULL;

ALTER TABLE orders ADD COLUMN delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0
  CHECK (delivery_fee >= 0);
ALTER TABLE orders ADD COLUMN delivery_partner_id INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN picked_up_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP;

ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'));

CREATE INDEX IF NOT EXISTS idx_orders_delivery ON orders(status, delivery_partner_id);

-- reviews: one per delivered order, buyer rates the farmer
CREATE TABLE reviews (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL UNIQUE REFERENCES orders(id),
  buyer_id   INTEGER NOT NULL REFERENCES users(id),
  farmer_id  INTEGER NOT NULL REFERENCES users(id),
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_farmer ON reviews(farmer_id);
