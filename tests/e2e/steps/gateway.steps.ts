import assert from 'node:assert/strict'
import { Given, Then, When } from '@cucumber/cucumber'

const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:3000'

interface World {
  response: Response | null
  responseBody: any
  sessionCookie: string | null
}

Given('the gateway is running', async () => {
  const res = await fetch(`${GATEWAY_URL}/health/live`)
  assert.equal(res.status, 200)
})

Given('I register and login via gateway', async function (this: World) {
  const email = `gateway-${Date.now()}@test.com`

  await fetch(`${GATEWAY_URL}/api/v1/identity/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'securepass123', name: 'Gateway', lastName: 'User' }),
  })

  const res = await fetch(`${GATEWAY_URL}/api/v1/identity/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'securepass123' }),
  })

  this.sessionCookie = res.headers.get('set-cookie')
})

When('I request gateway health', async function (this: World) {
  this.response = await fetch(`${GATEWAY_URL}/health/live`)
  this.responseBody = await this.response.json().catch(() => null)
})

When('I request catalog items via gateway', async function (this: World) {
  this.response = await fetch(`${GATEWAY_URL}/api/v1/catalog/items`)
  this.responseBody = await this.response.json()
})

When('I request catalog items via gateway with X-Request-Id {string}',
  async function (this: World, requestId: string) {
    this.response = await fetch(`${GATEWAY_URL}/api/v1/catalog/items`, {
      headers: { 'x-request-id': requestId },
    })
    this.responseBody = await this.response.json()
  })

When('I request my profile via gateway with session', async function (this: World) {
  this.response = await fetch(`${GATEWAY_URL}/api/v1/identity/me`, {
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
  this.responseBody = await this.response.json()
})

Then('the response should have an {string} header', function (this: World, header: string) {
  assert.ok(this.response!.headers.get(header), `Expected header "${header}" to be present`)
})

Then('the response header {string} should equal {string}',
  function (this: World, header: string, value: string) {
    assert.equal(this.response!.headers.get(header), value)
  })
