export interface User {
  id: number
  email: string
  name: string
  lastName: string
  street: string | null
  city: string | null
  state: string | null
  country: string | null
  zipCode: string | null
  createdAt: string
}

export interface CatalogItem {
  id: number
  name: string
  description: string
  price: number
  pictureFileName: string | null
  catalogTypeId: number
  catalogBrandId: number
  availableStock: number
  maxStockThreshold: number
  onReorder: boolean
  restockThreshold: number
}

export interface CatalogBrand {
  id: number
  brand: string
}

export interface CatalogType {
  id: number
  type: string
}

export type OrderStatus =
  | 'submitted'
  | 'awaiting_validation'
  | 'confirmed'
  | 'paid'
  | 'shipped'
  | 'cancelled'

export interface OrderItem {
  id: number
  productId: number
  productName: string
  unitPrice: number
  units: number
  pictureUrl: string | null
  discount: number
}

export interface Order {
  id: number
  buyerId: number
  status: OrderStatus
  description: string | null
  street: string | null
  city: string | null
  state: string | null
  country: string | null
  zipCode: string | null
  orderDate: string
  items: OrderItem[]
  total: number
}

export type WebhookEventType =
  | 'order.submitted'
  | 'order.confirmed'
  | 'order.paid'
  | 'order.shipped'
  | 'order.cancelled'
  | 'catalog.item.created'
  | 'catalog.item.price_changed'
  | 'catalog.item.deleted'
  | 'identity.user.registered'
  | 'identity.user.deleted'
  | 'stock.confirmed'
  | 'stock.rejected'
  | 'payment.succeeded'
  | 'payment.failed'

export interface WebhookSubscription {
  id: number
  url: string
  token: string
  eventType: WebhookEventType
  createdAt: string
}

export interface BasketItem {
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  pictureUrl?: string
}

export interface CustomerBasket {
  buyerId: string
  items: BasketItem[]
}

export interface PaginatedResult<T> {
  items: T[]
  totalItems: number
  totalPages: number
  page: number
  pageSize: number
}
