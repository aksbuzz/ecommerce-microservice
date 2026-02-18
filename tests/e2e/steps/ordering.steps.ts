import assert from 'node:assert/strict'
import { Before, Given, When } from '@cucumber/cucumber'

const ORDERING_URL = process.env.ORDERING_URL ?? 'http://localhost:3004'
const IDENTITY_URL = process.env.IDENTITY_URL ?? 'http://localhost:3002'

interface World {
  response: Response | null
  responseBody: any
  sessionCookie: string | null
  lastOrderId: number | null
}

Before(function (this: World) {
  this.lastOrderId = null
})

Given('the ordering service is running', async () => {
  const res = await fetch(`${ORDERING_URL}/health`)
  assert.equal(res.status, 200)
})

Given('I am authenticated as an ordering user', async function (this: World) {
  const email = `ordering-${Date.now()}@test.com`

  await fetch(`${IDENTITY_URL}/api/v1/identity/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'securepass123', name: 'Order', lastName: 'User' }),
  })

  const res = await fetch(`${IDENTITY_URL}/api/v1/identity/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'securepass123' }),
  })

  this.sessionCookie = res.headers.get('set-cookie')
})

Given('I am not authenticated as ordering user', function (this: World) {
  this.sessionCookie = null
})

Given('I have an order with item productId {int} and name {string} and price {float} and units {int}',
  async function (this: World, productId: number, name: string, price: number, units: number) {
    const res = await fetch(`${ORDERING_URL}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionCookie ? { cookie: this.sessionCookie } : {}),
      },
      body: JSON.stringify({
        items: [{ productId, productName: name, unitPrice: price, units }],
      }),
    })
    const body = await res.json()
    this.lastOrderId = body.id
  })

When('I create an order with item productId {int} and name {string} and price {float} and units {int}',
  async function (this: World, productId: number, name: string, price: number, units: number) {
    this.response = await fetch(`${ORDERING_URL}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionCookie ? { cookie: this.sessionCookie } : {}),
      },
      body: JSON.stringify({
        items: [{ productId, productName: name, unitPrice: price, units }],
      }),
    })
    this.responseBody = await this.response.json()
    if (this.responseBody.id) this.lastOrderId = this.responseBody.id
  })

When('I list my orders', async function (this: World) {
  this.response = await fetch(`${ORDERING_URL}/api/v1/orders`, {
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
  this.responseBody = await this.response.json()
})

When('I get order by last order ID', async function (this: World) {
  this.response = await fetch(`${ORDERING_URL}/api/v1/orders/${this.lastOrderId}`, {
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
  this.responseBody = await this.response.json()
})

When('I get order by ID {int}', async function (this: World, id: number) {
  this.response = await fetch(`${ORDERING_URL}/api/v1/orders/${id}`, {
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
  this.responseBody = await this.response.json().catch(() => null)
})

When('I cancel the last order', async function (this: World) {
  this.response = await fetch(`${ORDERING_URL}/api/v1/orders/${this.lastOrderId}/cancel`, {
    method: 'POST',
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
  this.responseBody = await this.response.json()
})

When('I list orders without session', async function (this: World) {
  this.response = await fetch(`${ORDERING_URL}/api/v1/orders`)
  this.responseBody = await this.response.json().catch(() => null)
})
