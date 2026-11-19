// Per-farmer rating summary, joined into listing and profile queries as "fr"
export const FARMER_RATINGS_JOIN = `
  LEFT JOIN (
    SELECT farmer_id,
           ROUND(AVG(rating)::numeric, 1) AS farmer_rating,
           COUNT(*) AS farmer_review_count
    FROM reviews
    GROUP BY farmer_id
  ) fr ON fr.farmer_id`;
