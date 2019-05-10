const minutes = 1000 * 60

export class DataStore<T> {
  private updatedAt?: Date
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

  reset() {
    this.outstandingPromise = undefined

    return this.data()
  }

  data(): Promise<T> {
    if (this.outstandingPromise && !this.isExpired) {
      return this.outstandingPromise
    }

    this.outstandingPromise = this.fetchData()

    this.outstandingPromise.then(data => {
      this.updatedAt = new Date()
    })
    return this.outstandingPromise
  }
}
