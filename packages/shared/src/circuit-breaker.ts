export type CircuitState = 'closed' | 'open' | 'half_open'

export interface CircuitBreakerOptions {
  failureThreshold?: number    // default: 5
  resetTimeoutMs?: number      // default: 30000
  halfOpenMaxAttempts?: number // default: 1
  name?: string
}

export class CircuitBreaker {
  state: CircuitState = 'closed'
  failureCount: number = 0
  successCount: number = 0
  lastFailureTime: number = 0
  failureThreshold: number
  resetTimeoutMs: number
  halfOpenMaxAttempts: number
  name: string

  constructor(options?: CircuitBreakerOptions) {
    this.failureThreshold = options?.failureThreshold ?? 5
    this.resetTimeoutMs = options?.resetTimeoutMs ?? 30_000
    this.halfOpenMaxAttempts = options?.halfOpenMaxAttempts ?? 1
    this.name = options?.name ?? 'default'
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = 'half_open'
        this.successCount = 0
      } else {
        throw new CircuitOpenError(this.name)
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (err) {
      this.onFailure()
      throw err
    }
  }

  onSuccess(): void {
    if (this.state === 'half_open') {
      this.successCount++
      if (this.successCount >= this.halfOpenMaxAttempts) {
        this.state = 'closed'
        this.failureCount = 0
      }
    } else {
      this.failureCount = 0
    }
  }

  onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open'
    }
  }

  getState(): { state: CircuitState; failureCount: number; lastFailureTime: number } {
    return { state: this.state, failureCount: this.failureCount, lastFailureTime: this.lastFailureTime }
  }
}

export class CircuitOpenError extends Error {
  constructor(circuitName: string) {
    super(`Circuit breaker '${circuitName}' is open — request rejected`)
    this.name = 'CircuitOpenError'
  }
}
