import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, fetchJson } from '@/lib/api'

export const useMyListings = () =>
  useQuery({ queryKey: ['listings', 'mine'], queryFn: () => fetchJson('/listings/mine') })

function useListingMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

/** body: { produce_id, available_qty, listing_price } */
export const useCreateListing = () =>
  useListingMutation((body) => api.post('/listings', body).then((res) => res.data))

/** { id, ...changes } where changes has available_qty and/or listing_price */
export const useUpdateListing = () =>
  useListingMutation(({ id, ...changes }) => api.patch(`/listings/${id}`, changes).then((res) => res.data))

export const useStopListing = () =>
  useListingMutation((id) => api.patch(`/listings/${id}/deactivate`).then((res) => res.data))

export const useDeleteListing = () => useListingMutation((id) => api.delete(`/listings/${id}`))
