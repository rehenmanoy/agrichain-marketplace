import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, fetchJson } from '@/lib/api'

/** Everything farmers in the buyer's region have on sale (buyers can only order from their own region) */
export const useRegionListings = (regionId) =>
  useQuery({
    queryKey: ['listings', 'region', regionId],
    queryFn: () => fetchJson('/listings', { params: { region_id: regionId } }),
    enabled: Boolean(regionId),
    refetchInterval: 60_000,
  })

/** The buyer's own orders, refreshed so status changes show up without reloading */
export const useMyOrders = () =>
  useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: () => fetchJson('/orders/mine'),
    refetchInterval: 30_000,
  })

function useBuyerMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export const useCancelMyOrder = () =>
  useBuyerMutation((id) => api.patch(`/orders/${id}/cancel`).then((res) => res.data))

/** { id, rating, comment } */
export const useReviewOrder = () =>
  useBuyerMutation(({ id, ...body }) => api.post(`/orders/${id}/review`, body).then((res) => res.data))
