import assert from 'node:assert/strict'
import { Before, Given, When } from '@cucumber/cucumber'

const BASE_URL = process.env.IDENTITY_URL ?? 'http://localhost:3002'

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

Given('the identity service is running', async () => {
  const res = await fetch(`${BASE_URL}/health`)
  assert.equal(res.status, 200)
})

Given('a user exists with email {string}', async function (this: World, email: string) {
  await fetch(`${BASE_URL}/api/v1/identity/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'securepass123', name: 'Test', lastName: 'User' }),
  })
})

Given('I am logged in as {string}', async function (this: World, email: string) {
  // Register
  await fetch(`${BASE_URL}/api/v1/identity/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'securepass123', name: 'Test', lastName: 'User' }),
  })

  // Login
  const res = await fetch(`${BASE_URL}/api/v1/identity/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'securepass123' }),
  })

  const setCookie = res.headers.get('set-cookie')
  this.sessionCookie = setCookie
})

When('I register with email {string} and password {string} and name {string} and lastName {string}',
  async function (this: World, email: string, password: string, name: string, lastName: string) {
    this.response = await fetch(`${BASE_URL}/api/v1/identity/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, lastName }),
    })
    this.responseBody = await this.response.json()
  })

When('I register with a unique email and password {string} and name {string} and lastName {string}',
  async function (this: World, password: string, name: string, lastName: string) {
    const email = `e2e-register-${Date.now()}@test.com`
    this.response = await fetch(`${BASE_URL}/api/v1/identity/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, lastName }),
    })
    this.responseBody = await this.response.json()
  })

When('I login with email {string} and password {string}',
  async function (this: World, email: string, password: string) {
    this.response = await fetch(`${BASE_URL}/api/v1/identity/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    this.responseBody = await this.response.json()
    const setCookie = this.response.headers.get('set-cookie')
    if (setCookie) this.sessionCookie = setCookie
  })

When('I request GET {string} with session', async function (this: World, path: string) {
  this.response = await fetch(`${BASE_URL}${path}`, {
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
  this.responseBody = await this.response.json()
})

When('I request GET {string} without session', async function (this: World, path: string) {
  this.response = await fetch(`${BASE_URL}${path}`)
  this.responseBody = await this.response.json()
})

When('I request PATCH {string} with session and body:', async function (this: World, path: string, body: string) {
  this.response = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(this.sessionCookie ? { cookie: this.sessionCookie } : {}),
    },
    body,
  })
  this.responseBody = await this.response.json()
})

When('I logout with session', async function (this: World) {
  this.response = await fetch(`${BASE_URL}/api/v1/identity/logout`, {
    method: 'POST',
    headers: this.sessionCookie ? { cookie: this.sessionCookie } : {},
  })
  this.responseBody = await this.response.json()
})

// Common assertions (status, contains, equals) are in common.steps.ts
