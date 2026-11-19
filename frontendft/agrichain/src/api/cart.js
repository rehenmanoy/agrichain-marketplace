import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, fetchJson } from '@/lib/api'

/** The buyer's cart, grouped by farmer, with live prices and stock */
export const useCart = () => useQuery({ queryKey: ['cart'], queryFn: () => fetchJson('/cart') })

/** Mutations that return the new cart put it straight into the cache */
function useCartMutation(mutationFn, { alsoOrders = false } = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (!alsoOrders) queryClient.setQueryData(['cart'], data)
      else queryClient.invalidateQueries({ queryKey: ['cart'] })
      if (alsoOrders) {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
      // stock shown in the shop has changed, or is about to
      queryClient.invalidateQueries({ queryKey: ['listings'] })
    },
  })
}

/** { listing_id, quantity } */
export const useAddToCart = () => useCartMutation((body) => api.post('/cart', body).then((res) => res.data))

/** { id, quantity } */
export const useUpdateCartItem = () =>
  useCartMutation(({ id, quantity }) => api.patch(`/cart/items/${id}`, { quantity }).then((res) => res.data))

export const useRemoveCartItem = () => useCartMutation((id) => api.delete(`/cart/items/${id}`).then((res) => res.data))

/** { delivery_address }; returns the orders that were placed (one per farmer) */
export const useCheckout = () =>
  useCartMutation((body) => api.post('/cart/checkout', body).then((res) => res.data), { alsoOrders: true })
