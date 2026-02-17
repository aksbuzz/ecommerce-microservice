import assert from 'node:assert/strict'
import { Before, Given, When } from '@cucumber/cucumber'

const BASE_URL = process.env.CATALOG_URL ?? 'http://localhost:3001'
const IDENTITY_URL = process.env.IDENTITY_URL ?? 'http://localhost:3002'

interface World {
  response: Response | null
  responseBody: any
  lastItemId: number | null
  sessionCookie: string | null
}

Before(function (this: World) {
  this.response = null
  this.responseBody = null
  this.lastItemId = null
  this.sessionCookie = null
})

async function ensureAuth(world: World): Promise<void> {
  if (world.sessionCookie) return

  const email = `catalog-${Date.now()}@test.com`
  await fetch(`${IDENTITY_URL}/api/v1/identity/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'securepass123', name: 'Catalog', lastName: 'User' }),
  })

  const res = await fetch(`${IDENTITY_URL}/api/v1/identity/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'securepass123' }),
  })

  world.sessionCookie = res.headers.get('set-cookie')
}

Given('the catalog service is running', async function (this: World) {
  const res = await fetch(`${BASE_URL}/health`)
  assert.equal(res.status, 200)
})

Given('a catalog item exists with name {string}', async function (this: World, name: string) {
  await ensureAuth(this)
  const res = await fetch(`${BASE_URL}/api/v1/catalog/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(this.sessionCookie ? { cookie: this.sessionCookie } : {}),
    },
    body: JSON.stringify({
      name,
      description: 'Test item for E2E',
      price: 10.00,
      catalogTypeId: 1,
      catalogBrandId: 1,
      availableStock: 10,
    }),
  })
  const body = await res.json()
  this.lastItemId = body.id
})

When('I request GET {string}', async function (this: World, path: string) {
  const url = path.replace('{lastItemId}', String(this.lastItemId))
  this.response = await fetch(`${BASE_URL}${url}`)
  this.responseBody = await this.response.json()
})

When('I request POST {string} with body:', async function (this: World, path: string, body: string) {
  await ensureAuth(this)
  const url = path.replace('{lastItemId}', String(this.lastItemId))
  this.response = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(this.sessionCookie ? { cookie: this.sessionCookie } : {}),
    },
    body,
  })
  this.responseBody = await this.response.json()
  if (this.responseBody.id) this.lastItemId = this.responseBody.id
})

When('I request PATCH {string} with body:', async function (this: World, path: string, body: string) {
  await ensureAuth(this)
  const url = path.replace('{lastItemId}', String(this.lastItemId))
  this.response = await fetch(`${BASE_URL}${url}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(this.sessionCookie ? { cookie: this.sessionCookie } : {}),
    },
    body,
  })
  this.responseBody = await this.response.json()
})

When('I request DELETE {string}', async function (this: World, path: string) {
  await ensureAuth(this)
  const url = path.replace('{lastItemId}', String(this.lastItemId))
  this.response = await fetch(`${BASE_URL}${url}`, {
    method: 'DELETE',
    headers: {
      ...(this.sessionCookie ? { cookie: this.sessionCookie } : {}),
    },
  })
  if (this.response.status !== 204) {
    this.responseBody = await this.response.json()
  }
})

// Common assertions (status, contains, equals) are in common.steps.ts
