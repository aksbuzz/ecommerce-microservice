import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PasswordService } from './password.service.ts'

describe('PasswordService', () => {
  const service = new PasswordService()

  it('should hash a password', async () => {
    const hash = await service.hash('mypassword')
    assert.ok(hash.includes(':'))
    assert.ok(hash.length > 64)
  })

  it('should verify a correct password', async () => {
    const hash = await service.hash('testpassword')
    const valid = await service.verify('testpassword', hash)
    assert.equal(valid, true)
  })

  it('should reject an incorrect password', async () => {
    const hash = await service.hash('testpassword')
    const valid = await service.verify('wrongpassword', hash)
    assert.equal(valid, false)
  })

  it('should produce different hashes for the same password', async () => {
    const hash1 = await service.hash('samepassword')
    const hash2 = await service.hash('samepassword')
    assert.notEqual(hash1, hash2)
  })
})
