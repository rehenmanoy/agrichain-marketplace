-- 005: Farmers can delete listings. Orders keep pointing at the listing, so a deleted
-- listing is only marked (deleted_at) and hidden everywhere, which keeps order history intact.

ALTER TABLE listings ADD COLUMN deleted_at TIMESTAMP;

CREATE INDEX idx_listings_not_deleted ON listings(farmer_id) WHERE deleted_at IS NULL;
