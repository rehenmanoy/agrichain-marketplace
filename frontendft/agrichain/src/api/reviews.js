import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, fetchJson } from '@/lib/api'

/** A farmer's reviews (public) */
export const useFarmerReviews = (farmerId) =>
  useQuery({
    queryKey: ['reviews', 'farmer', farmerId],
    queryFn: () => fetchJson('/reviews', { params: { farmer_id: farmerId } }),
    enabled: Boolean(farmerId),
  })

/** A delivery partner's reviews (public) */
export const usePartnerReviews = (partnerId) =>
  useQuery({
    queryKey: ['reviews', 'partner', partnerId],
    queryFn: () => fetchJson('/reviews/partners', { params: { partner_id: partnerId } }),
    enabled: Boolean(partnerId),
  })

/** A warehouse's reviews (public) */
export const useWarehouseReviews = (warehouseId, enabled = true) =>
  useQuery({
    queryKey: ['reviews', 'warehouse', warehouseId],
    queryFn: () => fetchJson('/reviews/warehouses', { params: { warehouse_id: warehouseId } }),
    enabled: Boolean(warehouseId && enabled),
  })

function useReviewMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      for (const key of ['reviews', 'orders', 'bookings', 'warehouses', 'listings', 'dashboard']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
  })
}

/** Buyer rates the delivery partner. { id (the order), rating, comment? } */
export const useReviewPartner = () =>
  useReviewMutation(({ id, ...body }) => api.post(`/orders/${id}/partner-review`, body).then((res) => res.data))

/** Farmer rates a warehouse after taking produce out. { id (the booking), rating, comment? } */
export const useReviewWarehouse = () =>
  useReviewMutation(({ id, ...body }) => api.post(`/warehouse-bookings/${id}/review`, body).then((res) => res.data))
