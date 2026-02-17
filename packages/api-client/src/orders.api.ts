import { api } from './client.ts'
import type { Order, OrderStatus, PaginatedResult } from './types.ts'

function qs(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export interface OrdersQuery {
  page?: number
  pageSize?: number
  status?: OrderStatus
}

export const ordersApi = {
  getOrders: (q: OrdersQuery = {}) =>
    api.get<PaginatedResult<Order>>(
      `/orders${qs(q as Record<string, string | number | undefined>)}`,
    ),
  getOrder: (id: number) => api.get<Order>(`/orders/${id}`),
  updateStatus: (id: number, status: OrderStatus) =>
    api.patch<Order>(`/orders/${id}/status`, { status }),
  cancelOrder: (id: number) => api.post<Order>(`/orders/${id}/cancel`, {}),
  getSummaries: (q: { page?: number; pageSize?: number } = {}) =>
    api.get<PaginatedResult<Order>>(
      `/orders/summaries${qs(q as Record<string, string | number | undefined>)}`,
    ),
}
