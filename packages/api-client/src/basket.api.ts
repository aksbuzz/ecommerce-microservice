import { api } from './client.ts'
import type { BasketItem, CustomerBasket } from './types.ts'

export const basketApi = {
  getBasket: () => api.get<CustomerBasket>('/basket'),
  updateBasket: (body: { items: BasketItem[] }) =>
    api.put<CustomerBasket>('/basket', body),
  addItem: (body: { productId: number; productName: string; unitPrice: number; quantity: number; pictureUrl?: string }) =>
    api.post<CustomerBasket>('/basket/items', body),
  updateQuantity: (productId: number, quantity: number) =>
    api.patch<CustomerBasket>(`/basket/items/${productId}`, { quantity }),
  removeItem: (productId: number) =>
    api.delete<CustomerBasket>(`/basket/items/${productId}`),
  clearBasket: () => api.delete<void>('/basket'),
  checkout: (data?: { street?: string; city?: string; state?: string; country?: string; zipCode?: string }) =>
    api.post<{ message: string }>('/basket/checkout', data ?? {}),
}
