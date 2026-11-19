-- 004: Use the market price site's produce names, so live prices can be found.
-- "Onion" and "Beans" don't exist on vegetablemarketprice.com; the site lists
-- "Onion Big" / "Onion Small" and "French Beans" / "Cluster beans".

UPDATE produce SET name = 'Onion Big'
WHERE name = 'Onion' AND NOT EXISTS (SELECT 1 FROM produce WHERE name = 'Onion Big');

UPDATE produce SET name = 'French Beans'
WHERE name = 'Beans' AND NOT EXISTS (SELECT 1 FROM produce WHERE name = 'French Beans');

-- Today's stored prices for these two came from loose text matching, so fetch them again
DELETE FROM price_history
WHERE date = CURRENT_DATE
  AND produce_id IN (SELECT id FROM produce WHERE name IN ('Onion Big', 'French Beans'));
