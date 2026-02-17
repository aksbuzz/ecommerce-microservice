import assert from 'node:assert/strict'
import { before, beforeEach, describe, it } from 'node:test'
import { CircuitBreaker, CircuitOpenError } from './circuit-breaker.ts'

describe('CircuitBreaker', () => {
  describe('closed state', () => {
    it('allows execution and returns result', async () => {
      const cb = new CircuitBreaker({ name: 'test' })
      const result = await cb.execute(async () => 'hello')
      assert.equal(result, 'hello')
      assert.equal(cb.state, 'closed')
    })

    it('resets failureCount on success', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 5, name: 'test' })
      // cause some failures but not enough to open
      const fail = async () => { throw new Error('boom') }
      await cb.execute(fail).catch(() => {})
      await cb.execute(fail).catch(() => {})
      assert.equal(cb.failureCount, 2)
      // now succeed — failureCount should reset
      await cb.execute(async () => 'ok')
      assert.equal(cb.failureCount, 0)
      assert.equal(cb.state, 'closed')
    })
  })

  describe('transitions to open after threshold failures', () => {
    it('opens circuit after reaching failureThreshold', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 3, name: 'test' })
      const fail = async () => { throw new Error('boom') }

      await cb.execute(fail).catch(() => {})
      assert.equal(cb.state, 'closed')
      await cb.execute(fail).catch(() => {})
      assert.equal(cb.state, 'closed')
      await cb.execute(fail).catch(() => {})
      assert.equal(cb.state, 'open')
      assert.equal(cb.failureCount, 3)
    })
  })

  describe('open state', () => {
    it('rejects immediately with CircuitOpenError without calling fn', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 60_000, name: 'my-circuit' })
      await cb.execute(async () => { throw new Error('fail') }).catch(() => {})
      assert.equal(cb.state, 'open')

      let fnCalled = false
      await assert.rejects(
        () => cb.execute(async () => { fnCalled = true; return 'result' }),
        (err: unknown) => {
          assert.ok(err instanceof CircuitOpenError)
          assert.equal((err as CircuitOpenError).name, 'CircuitOpenError')
          assert.ok((err as CircuitOpenError).message.includes('my-circuit'))
          return true
        }
      )
      assert.equal(fnCalled, false)
    })
  })

  describe('transitions to half_open after timeout', () => {
    it('moves to half_open when resetTimeoutMs has elapsed', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1, name: 'test' })
      await cb.execute(async () => { throw new Error('fail') }).catch(() => {})
      assert.equal(cb.state, 'open')

      // wait for timeout to elapse
      await new Promise((resolve) => setTimeout(resolve, 10))

      // next execute should transition to half_open and attempt execution
      const result = await cb.execute(async () => 'recovered')
      assert.equal(result, 'recovered')
      // after success in half_open, should close
      assert.equal(cb.state, 'closed')
    })

    it('stays open if timeout has not elapsed', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 60_000, name: 'test' })
      await cb.execute(async () => { throw new Error('fail') }).catch(() => {})
      assert.equal(cb.state, 'open')

      await assert.rejects(
        () => cb.execute(async () => 'result'),
        CircuitOpenError
      )
      assert.equal(cb.state, 'open')
    })
  })

  describe('half_open state', () => {
    it('transitions to closed on success', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1, halfOpenMaxAttempts: 1, name: 'test' })
      await cb.execute(async () => { throw new Error('fail') }).catch(() => {})
      await new Promise((resolve) => setTimeout(resolve, 10))

      // this execute transitions to half_open and succeeds
      await cb.execute(async () => 'ok')
      assert.equal(cb.state, 'closed')
      assert.equal(cb.failureCount, 0)
    })

    it('transitions back to open on failure', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1, name: 'test' })
      await cb.execute(async () => { throw new Error('fail') }).catch(() => {})
      await new Promise((resolve) => setTimeout(resolve, 10))

      // this execute transitions to half_open and fails
      await cb.execute(async () => { throw new Error('still failing') }).catch(() => {})
      assert.equal(cb.state, 'open')
    })

    it('requires halfOpenMaxAttempts successes before closing', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1, halfOpenMaxAttempts: 2, name: 'test' })
      await cb.execute(async () => { throw new Error('fail') }).catch(() => {})
      await new Promise((resolve) => setTimeout(resolve, 10))

      // first success in half_open — not enough to close
      await cb.execute(async () => 'first')
      assert.equal(cb.state, 'half_open')
      assert.equal(cb.successCount, 1)

      // second success — now closes
      await cb.execute(async () => 'second')
      assert.equal(cb.state, 'closed')
      assert.equal(cb.failureCount, 0)
    })
  })

  describe('getState', () => {
    it('returns current state snapshot', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 3, name: 'test' })
      const snap = cb.getState()
      assert.equal(snap.state, 'closed')
      assert.equal(snap.failureCount, 0)
      assert.equal(snap.lastFailureTime, 0)
    })
  })
})
