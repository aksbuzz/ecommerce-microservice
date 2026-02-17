import assert from 'node:assert/strict'
import { Then } from '@cucumber/cucumber'

interface World {
  response: Response | null
  responseBody: any
}

Then('the response status should be {int}', function (this: World, status: number) {
  assert.equal(this.response!.status, status)
})

Then('the response should contain {string}', function (this: World, field: string) {
  assert.ok(field in this.responseBody, `Response missing field "${field}"`)
})

Then('the response should contain {string} array', function (this: World, field: string) {
  assert.ok(Array.isArray(this.responseBody[field]), `Expected "${field}" to be an array`)
})

Then('the response should be a non-empty array', function (this: World) {
  assert.ok(Array.isArray(this.responseBody))
  assert.ok(this.responseBody.length > 0)
})

Then('the response {string} should equal {string}', function (this: World, field: string, value: string) {
  assert.equal(String(this.responseBody[field]), value)
})

Then('the response {string} should equal {float}', function (this: World, field: string, value: number) {
  assert.equal(this.responseBody[field], value)
})
