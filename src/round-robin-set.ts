const undefinedKey = Symbol('undefinedKey')

export class RoundRobinSet<T> {
  private store: T[]
  private cursors: {
    [undefinedKey]: number
    [k: string]: number
  } = {
    [undefinedKey]: 0,
  }

  constructor(...seed: T[]) {
    this.store = seed
  }

  reset() {
    this.cursors = {
      [undefinedKey]: 0,
    }
  }

  next(key?: string): T | undefined {
    let check = key || undefinedKey
    if (!this.cursors[check]) {
      this.cursors[check] = 0
    }

    const val = this.store[this.cursors[check]]

    this.cursors[check] = (this.cursors[check] + 1) % this.store.length

    return val
  }
}
