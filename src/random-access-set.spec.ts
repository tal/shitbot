import { RandomAccessSet } from './random-access-set'

describe('resetting', () => {
  test('should return an item after reset', () => {
    let set = new RandomAccessSet([1])

    set.next()
    set.reset()
    expect(set.next()).not.toBeUndefined()
  })

  test('should return an item after reset', () => {
    let set = new RandomAccessSet([1], [1])

    set.next()
    set.next()
    expect(set.next()).toBeUndefined()
    set.reset()
    expect(set.next()).not.toBeUndefined()
  })
})

describe('simple set', () => {
  let set = new RandomAccessSet([1, 1, 1])

  beforeEach(() => {
    set.reset()
  })

  test('should return once', () => {
    expect(set.next()).toBe(1)
  })

  test('should return 3 times', () => {
    expect(set.next()).toBe(1)
    expect(set.next()).toBe(1)
    expect(set.next()).toBe(1)
  })

  test('should only 3 times', () => {
    set.next()
    set.next()
    set.next()

    expect(set.next()).toBeUndefined()
  })
})

describe('with secondary set', () => {
  let set = new RandomAccessSet([1], [2])

  beforeEach(() => {
    set.reset()
  })

  test('should return 2 times', () => {
    expect(set.next()).toBe(1)
    expect(set.next()).toBe(2)
  })

  test('should only 2 times', () => {
    set.next()
    set.next()

    expect(set.next()).toBeUndefined()
  })
})

describe('auto reset', () => {
  test('single priority', () => {
    let set = new RandomAccessSet([1, 1, 1])
    set.autoReset = 'after-all'

    set.next()
    set.next()
    set.next()
    expect(set.next()).toBe(1)
  })

  test('multiple priority', () => {
    let set = new RandomAccessSet([1, 1], [2])
    set.autoReset = 'after-all'

    set.next()
    set.next()
    set.next()
    expect(set.next()).toBe(1)
  })
})
