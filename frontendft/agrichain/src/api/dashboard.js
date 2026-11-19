import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'

export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: () => fetchJson('/dashboard'), refetchInterval: 60_000 })
