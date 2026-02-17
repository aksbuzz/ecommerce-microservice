import { ApiError, ordersApi } from '@ecommerce/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'

export function useOrderSummaries(page = 1) {
  return useQuery({
    queryKey: ['orders', 'summaries', page],
    queryFn: () => ordersApi.getSummaries({ page, pageSize: 10 }),
  })
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.getOrder(id),
    enabled: id > 0,
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ordersApi.cancelOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      toast({ title: 'Order cancelled' })
    },
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Could not cancel order', variant: 'destructive' })
    },
  })
}
