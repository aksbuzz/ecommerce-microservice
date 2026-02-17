import { type Static, Type } from '@sinclair/typebox'

export const UserSchema = Type.Object({
  id: Type.Integer(),
  email: Type.String({ format: 'email' }),
  name: Type.String(),
  lastName: Type.String(),
  street: Type.Union([Type.String(), Type.Null()]),
  city: Type.Union([Type.String(), Type.Null()]),
  state: Type.Union([Type.String(), Type.Null()]),
  country: Type.Union([Type.String(), Type.Null()]),
  zipCode: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
})

export type User = Static<typeof UserSchema>

export const RegisterSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8, maxLength: 128 }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  lastName: Type.String({ minLength: 1, maxLength: 100 }),
})

export type RegisterInput = Static<typeof RegisterSchema>

export const LoginSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 1 }),
})

export type LoginInput = Static<typeof LoginSchema>

export const UpdateProfileSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  lastName: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  street: Type.Optional(Type.String()),
  city: Type.Optional(Type.String()),
  state: Type.Optional(Type.String()),
  country: Type.Optional(Type.String()),
  zipCode: Type.Optional(Type.String()),
})

export type UpdateProfileInput = Static<typeof UpdateProfileSchema>
