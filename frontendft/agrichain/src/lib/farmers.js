/**
 * Turns the region's listings into one entry per farmer: { id, name, location, rating, reviewCount, items }.
 * Best-rated farmers first, then the ones with the most produce on sale.
 */
export function groupByFarmer(listings) {
  const farmers = new Map()
  for (const listing of listings) {
    if (!farmers.has(listing.farmer_id)) {
      farmers.set(listing.farmer_id, {
        id: listing.farmer_id,
        name: listing.farmer_name,
        location: listing.farmer_location,
        rating: listing.farmer_rating,
        reviewCount: listing.farmer_review_count,
        items: [],
      })
    }
    farmers.get(listing.farmer_id).items.push(listing)
  }
  return [...farmers.values()].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.items.length - a.items.length)
}
