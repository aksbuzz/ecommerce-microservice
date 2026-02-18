import assert from 'node:assert/strict'
import { Before, Given, When } from '@cucumber/cucumber'

const WEBHOOKS_URL = process.env.WEBHOOKS_URL ?? 'http://localhost:3005'
const IDENTITY_URL = process.env.IDENTITY_URL ?? 'http://localhost:3002'

interface World {
  response: Response | null
  responseBody: any
  sessionCookie: string | null
  lastWebhookId: number | null
}

Before(function (this: World) {
  this.lastWebhookId = null
})

Given('the webhooks service is running', async () => {
  const res = await fetch(`${WEBHOOKS_URL}/health`)
  assert.equal(res.status, 200)
})

Given('I am authenticated as a webhooks user', async function (this: World) {
  const email = `webhooks-${Date.now()}@test.com`

  await fetch(`${IDENTITY_URL}/api/v1/identity/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'securepass123', name: 'Webhook', lastName: 'User' }),
  })

  const res = await fetch(`${IDENTITY_URL}/api/v1/identity/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'securepass123' }),
  })

  this.sessionCookie = res.headers.get('set-cookie')
})

Given('I am not authenticated as webhooks user', function (this: World) {
  this.sessionCookie = null
})

Given('a webhook subscription exists for event {string} to {string}',
  async function (this: World, eventType: string, url: string) {
    const res = await fetch(`${WEBHOOKS_URL}/api/v1/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionCookie ? { cookie: this.sessionCookie } : {}),
      },
      body: JSON.stringify({ url, token: 'test-token-12345678', eventType }),
    })
    const body = await res.json()
    this.lastWebhookId = body.id
  })

When('I list webhook subscriptions', async function (this: World) {
  this.response = await fetch(`${WEBHOOKS_URL}/api/v1/webhooks`, {
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
  this.responseBody = await this.response.json()
})

When('I create a webhook subscription for event {string} to {string}',
  async function (this: World, eventType: string, url: string) {
    this.response = await fetch(`${WEBHOOKS_URL}/api/v1/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionCookie ? { cookie: this.sessionCookie } : {}),
      },
      body: JSON.stringify({ url, token: 'test-token-12345678', eventType }),
    })
    this.responseBody = await this.response.json()
    if (this.responseBody.id) this.lastWebhookId = this.responseBody.id
  })

When('I delete the last webhook subscription', async function (this: World) {
  this.response = await fetch(`${WEBHOOKS_URL}/api/v1/webhooks/${this.lastWebhookId}`, {
    method: 'DELETE',
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
  this.responseBody = null
})

When('I delete webhook subscription {int}', async function (this: World, id: number) {
  this.response = await fetch(`${WEBHOOKS_URL}/api/v1/webhooks/${id}`, {
    method: 'DELETE',
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
  this.responseBody = await this.response.json().catch(() => null)
})

When('I list webhooks without session', async function (this: World) {
  this.response = await fetch(`${WEBHOOKS_URL}/api/v1/webhooks`)
  this.responseBody = await this.response.json().catch(() => null)
})
