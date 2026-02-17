import { type Static, Type } from '@sinclair/typebox'

export const OrderStatusEnum = Type.Union([
  Type.Literal('submitted'),
  Type.Literal('awaiting_validation'),
  Type.Literal('confirmed'),
  Type.Literal('paid'),
  Type.Literal('shipped'),
  Type.Literal('cancelled'),
])

export type OrderStatus = Static<typeof OrderStatusEnum>

export const OrderItemSchema = Type.Object({
  id: Type.Integer(),
  productId: Type.Integer(),
  productName: Type.String(),
  unitPrice: Type.Number(),
  units: Type.Integer(),
  pictureUrl: Type.Union([Type.String(), Type.Null()]),
  discount: Type.Number(),
})

export type OrderItem = Static<typeof OrderItemSchema>

export const OrderSchema = Type.Object({
  id: Type.Integer(),
  buyerId: Type.Integer(),
  status: OrderStatusEnum,
  description: Type.Union([Type.String(), Type.Null()]),
  street: Type.Union([Type.String(), Type.Null()]),
  city: Type.Union([Type.String(), Type.Null()]),
  state: Type.Union([Type.String(), Type.Null()]),
  country: Type.Union([Type.String(), Type.Null()]),
  zipCode: Type.Union([Type.String(), Type.Null()]),
  orderDate: Type.String(),
  items: Type.Array(OrderItemSchema),
  total: Type.Number(),
})

export type Order = Static<typeof OrderSchema>

export const CreateOrderSchema = Type.Object({
  street: Type.Optional(Type.String()),
  city: Type.Optional(Type.String()),
  state: Type.Optional(Type.String()),
  country: Type.Optional(Type.String()),
  zipCode: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  items: Type.Array(Type.Object({
    productId: Type.Integer(),
    productName: Type.String(),
    unitPrice: Type.Number(),
    units: Type.Integer({ minimum: 1 }),
    pictureUrl: Type.Optional(Type.String()),
  }), { minItems: 1 }),
})

export type CreateOrderInput = Static<typeof CreateOrderSchema>

export const OrderByIdParamsSchema = Type.Object({
  id: Type.Integer(),
})

export const OrdersQuerySchema = Type.Object({
  page: Type.Integer({ minimum: 1, default: 1 }),
  pageSize: Type.Integer({ minimum: 1, maximum: 50, default: 10 }),
  status: Type.Optional(OrderStatusEnum),
})

export type OrdersQuery = Static<typeof OrdersQuerySchema>
