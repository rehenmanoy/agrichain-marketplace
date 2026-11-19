import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, fetchJson } from '@/lib/api'

export const useRegions = () =>
  useQuery({ queryKey: ['regions'], queryFn: () => fetchJson('/regions'), staleTime: Infinity })

export const useProduceList = () =>
  useQuery({ queryKey: ['produce'], queryFn: () => fetchJson('/produce'), staleTime: 60 * 60 * 1000 })

/** Today's (and yesterday's) market price for every produce item */
export const useMarketPrices = () =>
  useQuery({
    queryKey: ['prices'],
    queryFn: () => fetchJson('/produce/prices'),
    staleTime: 10 * 60 * 1000,
  })

export const useProducePrice = (produceId) =>
  useQuery({
    queryKey: ['price', produceId],
    queryFn: () => fetchJson(`/produce/${produceId}/price`),
    enabled: Boolean(produceId),
    staleTime: 10 * 60 * 1000,
    retry: false,
  })

/** A farmer adds a produce type that is not in the list. { name, category }; answers the new produce row. */
export function useCreateProduce() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post('/produce', body).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produce'] }),
  })
}
