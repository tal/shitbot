import { LogLevel, ConsoleLogger, Logger } from '@slack/logger'

const minutes = 1000 * 60

export class DataStore<T> {
  private updatedAt?: Date
  private outstandingPromise?: Promise<T>
  private logger: Logger = new ConsoleLogger()

  /** ms until the data expires */
  ttl = 5 * minutes

  constructor(
    readonly name: string,
    logLevel: LogLevel,
    private fetchData: () => Promise<T>,
  ) {
    this.logger.setName(name)
    this.logger.setLevel(logLevel)
  }

  get logLevel() {
    return this.logger.getLevel()
  }

  set logLevel(level: LogLevel) {
    this.logger.setLevel(level)
  }

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

  get needsFetch() {
    return this.outstandingPromise && !this.isExpired
  }

  data(): Promise<T> {
    if (!this.needsFetch && this.outstandingPromise) {
      return this.outstandingPromise
    }

    this.outstandingPromise = this.fetchData()
    const startedFetch = new Date()

    this.logger.debug(`Fetching data for store ${this.name}`)

    this.outstandingPromise.then(data => {
      const now = new Date()
      this.updatedAt = now

      this.logger.debug(
        `Fetched data for store ${this.name} in ${now.getTime() -
          startedFetch.getTime()}ms`,
      )
    })

    return this.outstandingPromise
  }
}
