import assert from 'node:assert/strict'
import { Before, Given, Then, When } from '@cucumber/cucumber'

const BASKET_URL = process.env.BASKET_URL ?? 'http://localhost:3003'
const IDENTITY_URL = process.env.IDENTITY_URL ?? 'http://localhost:3002'

interface World {
  response: Response | null
  responseBody: any
  sessionCookie: string | null
}

Before(function (this: World) {
  this.response = null
  this.responseBody = null
  this.sessionCookie = null
})

Given('the basket service is running', async () => {
  const res = await fetch(`${BASKET_URL}/health`)
  assert.equal(res.status, 200)
})

Given('I am authenticated as a basket user', async function (this: World) {
  const email = `basket-${Date.now()}@test.com`

  await fetch(`${IDENTITY_URL}/api/v1/identity/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'securepass123', name: 'Basket', lastName: 'User' }),
  })

  const res = await fetch(`${IDENTITY_URL}/api/v1/identity/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'securepass123' }),
  })

  this.sessionCookie = res.headers.get('set-cookie')
})

Given('I am not authenticated', function (this: World) {
  this.sessionCookie = null
})

Given('I have item with productId {int} and name {string} and price {float} and quantity {int} in basket',
  async function (this: World, productId: number, name: string, price: number, quantity: number) {
    await fetch(`${BASKET_URL}/api/v1/basket/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionCookie ? { cookie: this.sessionCookie } : {}),
      },
      body: JSON.stringify({ productId, productName: name, unitPrice: price, quantity }),
    })
  })

When('I get my basket', async function (this: World) {
  this.response = await fetch(`${BASKET_URL}/api/v1/basket`, {
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
  this.responseBody = await this.response.json()
})

When('I get basket without session', async function (this: World) {
  this.response = await fetch(`${BASKET_URL}/api/v1/basket`)
  this.responseBody = await this.response.json().catch(() => null)
})

When('I add item to basket with productId {int} and name {string} and price {float} and quantity {int}',
  async function (this: World, productId: number, name: string, price: number, quantity: number) {
    this.response = await fetch(`${BASKET_URL}/api/v1/basket/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionCookie ? { cookie: this.sessionCookie } : {}),
      },
      body: JSON.stringify({ productId, productName: name, unitPrice: price, quantity }),
    })
    this.responseBody = await this.response.json()
  })

When('I update item {int} quantity to {int}',
  async function (this: World, productId: number, quantity: number) {
    this.response = await fetch(`${BASKET_URL}/api/v1/basket/items/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionCookie ? { cookie: this.sessionCookie } : {}),
      },
      body: JSON.stringify({ quantity }),
    })
    this.responseBody = await this.response.json()
  })

When('I remove item {int} from basket', async function (this: World, productId: number) {
  this.response = await fetch(`${BASKET_URL}/api/v1/basket/items/${productId}`, {
    method: 'DELETE',
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
  this.responseBody = await this.response.json()
})

When('I checkout my basket', async function (this: World) {
  this.response = await fetch(`${BASKET_URL}/api/v1/basket/checkout`, {
    method: 'POST',
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
  this.responseBody = await this.response.json().catch(() => null)
})

When('I delete my basket', async function (this: World) {
  this.response = await fetch(`${BASKET_URL}/api/v1/basket`, {
    method: 'DELETE',
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
})

Then('the basket should have {int} items', function (this: World, count: number) {
  assert.equal(this.responseBody.items.length, count)
})

Then('the basket item with productId {int} should have quantity {int}',
  function (this: World, productId: number, quantity: number) {
    const item = this.responseBody.items.find((i: any) => i.productId === productId)
    assert.ok(item, `Item with productId ${productId} not found`)
    assert.equal(item.quantity, quantity)
  })
