export class KeyLock {
  private lastAction: { [k: string]: Date } = {}

  constructor(private ttl: number) {}

  attempt(key: string) {
    let lastActionAt = this.lastAction[key]

    let shouldAct: boolean

    if (lastActionAt) {
      shouldAct = lastActionAt.getTime() + this.ttl < new Date().getTime()
    } else {
      shouldAct = true
    }

    if (shouldAct) {
      this.lastAction[key] = new Date()
    }

    return shouldAct
  }
}
