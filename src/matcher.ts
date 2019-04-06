import { Message } from './message'
import { KeyLock } from './key-lock'

/**
 * A private function that defines how a matcher should work, only supposed
 * to be used privately within the matcher class.
 */
type MatcherFunc = (msg: Message) => any

type MatcherResult = { matched: boolean; results: any[] }

function isMatcherResult(res?: any): res is MatcherResult {
  return (
    res &&
    (res.matched === true || res.matched === false) &&
    res.results instanceof Array
  )
}

export class Matcher {
  private baseMatchers: MatcherFunc[]
  constructor(...matchers: MatcherFunc[]) {
    this.baseMatchers = matchers
  }

  /**
   * Checks if the text of message starts with supplied string
   * @param str
   */
  startsWith = (str: string) => {
    return this.append(
      msg => msg.text.startsWith(str) && msg.text.substring(str.length),
    )
  }

  /**
   * Checks if the text of the message has passed string anywehre in it
   * @param str
   */
  contains = (str: string) => {
    return this.append(msg => msg.text.includes(str))
  }

  /**
   * A rule that will return true if any of the passed matchers are true
   *
   * @param matchers
   */
  or = (...matchers: Matcher[]) => {
    return this.append(msg => {
      let results: any[] = []
      for (let m of matchers) {
        let result = m._matchMessage(msg)

        if (result.matched) {
          return result
        } else {
          results = results.concat(result.results)
        }
      }

      return {
        matched: false,
        results,
      }
    })
  }

  /**
   * A rule that will return true if all of the passed matchers are true
   *
   * @param matchers
   */
  and = (...matchers: Matcher[]) => {
    return this.append(msg => {
      let results: any[] = []
      for (let m of matchers) {
        let result = m._matchMessage(msg)
        results = results.concat(result.results)

        if (!result.matched) {
          return {
            matched: false,
            results,
          }
        }
      }

      return {
        matched: true,
        results,
      }
    })
  }

  /**
   * This matches the text based on a regex.
   *
   * It appends the match to the handler's arguments
   * @param regex Regext to apply to text of message
   */
  matches = (regex: RegExp) => {
    return this.append(msg => msg.text.match(regex))
  }

  /**
   * Compares if the message sent equals exactly the supplied one.
   * @param str
   */
  messageIs = (str: string) => {
    return this.append(msg => msg.text === str)
  }

  /**
   * Checks if the bot is either @mentioned or IMed
   */
  get directedAtBot() {
    return this.append(msg => msg.directedAtBot)
  }

  /**
   * Checks if the bot is @mentioned
   */
  get mentionsBot() {
    return this.append(msg => msg.mentionedBot)
  }

  /**
   * Checks if the message is sent in an IM
   */
  get isIM() {
    return this.append(msg => !!msg.im)
  }

  /**
   * Checks to see if hte message was sent in any of the supplied channels
   * @param strs
   */
  inChannel = (...strs: string[]) => {
    // Remove # from beginning of all channels
    strs = strs.map(str => (str.startsWith('#') ? str.slice(1) : str))
    return this.append(msg => !!strs.find(str => msg.channelName === str))
  }

  throttledBy = (
    lockOrTTL: KeyLock | number,
    key: (msg: Message) => string,
  ) => {
    let lock: KeyLock

    if (lockOrTTL instanceof KeyLock) {
      lock = lockOrTTL
    } else {
      lock = new KeyLock(lockOrTTL)
    }

    return this.append(msg => {
      return lock.attempt(key(msg))
    })
  }

  get throttledByUser() {
    return this.throttledBy(4 * 60 * 60 * 1000, msg => msg.userID)
  }

  get throttledByConversation() {
    return this.throttledBy(4 * 60 * 60 * 1000, msg => msg.conversationId)
  }

  private append(fn: MatcherFunc) {
    return new Matcher(...this.baseMatchers, fn)
  }

  _matchMessage(msg: Message): { matched: boolean; results: any[] } {
    let results: any[] = []
    for (let matcher of this.baseMatchers) {
      let val = matcher(msg)

      if (isMatcherResult(val)) {
        if (!val.matched) {
          return val
        } else {
          results.push(val.results)
        }
      } else {
        if (val === false || val === undefined || val === null) {
          return {
            matched: false,
            results,
          }
        }

        if (val === true) {
          continue
        }

        results.push(val)
      }
    }

    return {
      matched: true,
      results,
    }
  }
}
