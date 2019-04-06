function deepCopy<T>(arr: T[][]): T[][] {
  return arr.map(a2 => a2.slice(0))
}

// A potentially simpler implementation, but wasnt sure if it's worth it
function* randomAccessSet<T>(...seed: T[][]) {
  for (let set of deepCopy(seed)) {
    do {
      const index = Math.floor(Math.random() * set.length)
      const [item] = set.splice(index, 1)

      yield item
    } while (set.length)
  }
}

export class RandomAccessSet<T> {
  private store: T[][]
  private unusedStore: T[][]
  private dirty = false

  autoReset: 'none' | 'after-all' = 'none'

  constructor(...seed: T[][]) {
    this.store = seed
    this.unusedStore = deepCopy(seed)
  }

  reset() {
    if (!this.dirty) return
    this.unusedStore = deepCopy(this.store)
    this.dirty = false
  }

  next() {
    let set = this.unusedStore.shift()

    if ((!set || set.length === 0) && this.autoReset === 'after-all') {
      this.reset()
      set = this.unusedStore.shift()
    }

    if (set && set.length > 0) {
      const index = Math.floor(Math.random() * set.length)
      const [item] = set.splice(index, 1)

      if (set.length > 0) {
        this.unusedStore.unshift(set)
      }

      this.dirty = true
      return item
    }
  }
}
