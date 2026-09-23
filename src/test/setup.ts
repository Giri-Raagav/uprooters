import '@testing-library/jest-dom'

// In Node 20+ with JSDOM and React Router 6.4+, JSDOM's AbortSignal
// fails Node's native Request (Undici) brand check when Remix router creates client-side requests.
const OriginalRequest = globalThis.Request
if (OriginalRequest) {
  ;(globalThis as unknown as { Request: typeof OriginalRequest }).Request = class Request extends OriginalRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      if (init && 'signal' in init) {
        try {
          super(input, init)
          return
        } catch {
          const { signal: _signal, ...rest } = init
          super(input, rest)
          return
        }
      }
      super(input, init)
    }
  }
}
