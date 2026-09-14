import { test, expect } from './mind-elixir-test'
import { createBus } from '../src/utils/pubsub'

type Events = { ping: (n: number) => void }

test('removeListener - drops every registration of the same handler', () => {
  const bus = createBus<Events>()
  let calls = 0
  const handler = (_n: number) => {
    calls += 1
  }

  bus.addListener('ping', handler)
  bus.addListener('ping', handler)
  bus.fire('ping', 1)
  expect(calls).toBe(2)

  bus.removeListener('ping', handler)
  calls = 0
  bus.fire('ping', 1)
  // Forward iteration skipped the handler that slid into the removed slot, so
  // one of the two registrations survived.
  expect(calls).toBe(0)
})

test('removeListener - a type with no handler clears the list', () => {
  const bus = createBus<Events>()
  let calls = 0
  const handler = (_n: number) => {
    calls += 1
  }
  bus.addListener('ping', handler)
  bus.addListener('ping', handler)
  bus.removeListener('ping', undefined as unknown as (n: number) => void)
  bus.fire('ping', 1)
  expect(calls).toBe(0)
})
