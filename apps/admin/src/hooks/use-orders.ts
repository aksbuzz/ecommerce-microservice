import { ApiError, type OrderStatus, type OrdersQuery, ordersApi } from '@ecommerce/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'

export function useOrders(query: OrdersQuery = {}) {
  return useQuery({
    queryKey: ['orders', query],
    queryFn: () => ordersApi.getOrders(query),
  })
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.getOrder(id),
    enabled: id > 0,
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.setQueryData(['orders', data.id], data)
      toast({ title: 'Order status updated' })
    },
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Failed to update status', variant: 'destructive' })
    },
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
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Failed to cancel order', variant: 'destructive' })
    },
  })
}
