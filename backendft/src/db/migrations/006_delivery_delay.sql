-- 006: A partner can report that a delivery is running late (the buyer and farmer see it),
-- or give a delivery back so another partner can take it.

ALTER TABLE orders
  ADD COLUMN delay_reason TEXT
    CHECK (delay_reason IN ('TRAFFIC', 'VEHICLE', 'WEATHER', 'WAITING_AT_FARM', 'OTHER')),
  ADD COLUMN delay_minutes INTEGER CHECK (delay_minutes BETWEEN 5 AND 240),
  ADD COLUMN delayed_at TIMESTAMP;
