-- 007: Shopping cart. An order now belongs to one farmer and can hold several products
-- (order_items). Buyers collect products in a cart (cart_items) before checking out.

-- Items of an order
CREATE TABLE order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_listing ON order_items(listing_id);

-- Every existing order becomes an order with one item
INSERT INTO order_items (order_id, listing_id, quantity, unit_price, line_total)
SELECT id, listing_id, quantity, unit_price, total_price FROM orders;

-- The farmer is now stored on the order itself
ALTER TABLE orders ADD COLUMN farmer_id INTEGER REFERENCES users(id);
UPDATE orders o SET farmer_id = l.farmer_id FROM listings l WHERE l.id = o.listing_id;
ALTER TABLE orders ALTER COLUMN farmer_id SET NOT NULL;
CREATE INDEX idx_orders_farmer ON orders(farmer_id);

-- These now live in order_items (total_price stays as the items total)
DROP INDEX IF EXISTS idx_orders_listing;
ALTER TABLE orders DROP COLUMN listing_id;
ALTER TABLE orders DROP COLUMN quantity;
ALTER TABLE orders DROP COLUMN unit_price;

-- The buyer's cart
CREATE TABLE cart_items (
  id         SERIAL PRIMARY KEY,
  buyer_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (buyer_id, listing_id)
);
