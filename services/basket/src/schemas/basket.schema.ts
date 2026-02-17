import { type Static, Type } from '@sinclair/typebox'

export const BasketItemSchema = Type.Object({
  productId: Type.Integer(),
  productName: Type.String(),
  unitPrice: Type.Number(),
  quantity: Type.Integer({ minimum: 1 }),
  pictureUrl: Type.Optional(Type.String()),
})

export type BasketItem = Static<typeof BasketItemSchema>

export const CustomerBasketSchema = Type.Object({
  buyerId: Type.String(),
  items: Type.Array(BasketItemSchema),
})

export type CustomerBasket = Static<typeof CustomerBasketSchema>

export const UpdateBasketSchema = Type.Object({
  items: Type.Array(BasketItemSchema, { minItems: 0 }),
})

export type UpdateBasketInput = Static<typeof UpdateBasketSchema>

export const AddItemSchema = Type.Object({
  productId: Type.Integer(),
  productName: Type.String(),
  unitPrice: Type.Number(),
  quantity: Type.Integer({ minimum: 1, default: 1 }),
  pictureUrl: Type.Optional(Type.String()),
})

export type AddItemInput = Static<typeof AddItemSchema>

export const UpdateQuantitySchema = Type.Object({
  quantity: Type.Integer({ minimum: 1 }),
})

export const CheckoutSchema = Type.Object({
  street: Type.Optional(Type.String()),
  city: Type.Optional(Type.String()),
  state: Type.Optional(Type.String()),
  country: Type.Optional(Type.String()),
  zipCode: Type.Optional(Type.String()),
})

export type CheckoutInput = Static<typeof CheckoutSchema>
