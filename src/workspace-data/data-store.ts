const minutes = 1000 * 60

export class DataStore<T> {
  private updatedAt?: Date
  private storedData?: T
  private outstandingPromise?: Promise<T>

  /** ms until the data expires */
  ttl = 5 * minutes

  constructor(private fetchData: () => Promise<T>) {}
  get isExpired(): boolean {
    if (!this.updatedAt) {
      return true
    }

    const deathTime = this.updatedAt.getTime() + this.ttl
    return deathTime > new Date().getTime()
  }

  async data(): Promise<T> {
    if (!this.isExpired) return this.performFetch()
    if (!this.storedData) return this.performFetch()

    return this.storedData
  }

  private performFetch(): Promise<T> {
    if (this.outstandingPromise) {
      return this.outstandingPromise
    }

    this.storedData = undefined
    this.outstandingPromise = this.fetchData()

    this.outstandingPromise.then(data => {
      this.storedData = data
      this.updatedAt = new Date()
    })
    return this.outstandingPromise
  }
}
