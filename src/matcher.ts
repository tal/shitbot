import { Message } from './message'
import { KeyLock } from './key-lock'
import { hours, notEmpty } from './utils'

/**
 * A private function that defines how a matcher should work, only supposed
 * to be used privately within the matcher class.
 */
type MatcherFunc = (msg: Message) => any

/**
 * The final output of a matcher, it contains whether it was scucessful but also contains
 * the output of the matchers so they can be passed to the handeler.
 */
type MatcherResult = { matched: boolean; results: any[] }

function isMatcherResult(res?: any): res is MatcherResult {
  return (
    res &&
    (res.matched === true || res.matched === false) &&
    res.results instanceof Array
  )
}

/**
 * Used for matching messages against logic. Designed to chain together many `MatcherFunc`s
 * using a builder pattern. The matchers are matched from left to right with first element in
 * internal storage being checked first.
 */
export class Matcher {
  baseMatchers: MatcherFunc[]
  constructor(...matchers: MatcherFunc[]) {
    this.baseMatchers = matchers
  }

  /**
   * Checks if the text of message starts with supplied string
   * @param str
   */
  startsWith = (...strs: string[]) =>
    this.append(
      // First part is to see if it starts, second is to return the substring after
      // the prefix to the handler
      msg => {
        for (let str of strs) {
          if (msg.text.startsWith(str)) {
            return msg.text.substring(str.length).trimLeft()
          }
        }
      },
    )

  /**
   * Checks if the text of the message has passed string anywehre in it
   * @param str
   */
  contains = (...strs: string[]) =>
    this.append(msg => {
      for (let str of strs) {
        if (msg.text.includes(str)) {
          return true
        }
      }
    })

  /**
   * A rule that will return true if any of the passed matchers are true, the results of the
   * contained results are returned as an array.
   *
   * @param matchers
   */
  or = (...matchers: Matcher[]) =>
    this.append(msg => {
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

  /**
   * A rule that will return true if all of the passed matchers are true, the results of the
   * contained results are returned as an array.
   *
   * @param matchers
   */
  and = (...matchers: Matcher[]) =>
    this.append(msg => {
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

  /**
   * Only matchif the nested matcher is not true
   */
  not = (matcher: Matcher) =>
    this.append(msg => {
      let result = matcher._matchMessage(msg)

      return !result.matched
    })

  /**
   * This matches the text based on a regex.
   *
   * It appends the match to the handler's arguments
   * @param regex Regext to apply to text of message
   */
  matches = (...regexs: RegExp[]) =>
    this.append(msg => regexs.find(regex => msg.text.match(regex)))

  /**
   * Compares if the message sent equals exactly the supplied one.
   * @param str
   */
  messageIs = (...strs: string[]) =>
    this.append(msg => strs.find(str => str === msg.text))

  // reactedWith = (...emojis: string[]) => this.append(msg => {})

  /**
   * Checks if the bot is either @mentioned or IMed
   */
  get directedAtBot() {
    return this.append(msg => msg.directedAtBot)
  }

  /**
   * Checks if the bot is @mentioned in the message
   */
  get mentionsBot() {
    return this.append(msg => msg.mentionedBot)
  }

  /**
   * Checks if the message is sent in an IM (to the bot)
   */
  get isIM() {
    return this.append(msg => !!msg.im)
  }

  /**
   * Checks to see if the message was sent in any of the supplied channels
   * @param strs A list of channel names to match on, will match on any provided
   */
  inChannel = (...strs: string[]) => {
    // Remove # from beginning of all channels
    strs = strs.map(str => (str.startsWith('#') ? str.slice(1) : str))
    return this.append(msg => !!strs.find(str => msg.channelName === str))
  }

  /**
   * Alias of inChannel
   *
   * Checks to see if the message was sent in any of the supplied channels
   * @param strs A list of channel names to match on, will match on any provided
   */
  inChannels = (...strs: string[]) => this.inChannel(...strs)

  /**
   * Checks to see if a set of users were the ones who sent the message
   */
  byUser = (...strs: string[]) =>
    this.append(msg => !!strs.find(str => msg.userName === str))

  /**
   * Throttles the execution of this matcher chain. Should be placed last
   *
   * @param lockOrTTL Provide a ms limit to throttle by, or you can provide an
   * instance of `KeyLock` that has custom logic.
   * @param key The key associated with this message to lock on, often the user id
   * of the sender or the channel id the message was sent in.
   */
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

  /**
   * Throttles so that any user can only trigger it every 4 hours.
   */
  get throttledByUser() {
    return this.throttledBy(4 * hours, msg => msg.userId)
  }

  /**
   * Throttles by the channel the message is in, throttled to 4 hours.
   */
  get throttledByConversation() {
    return this.throttledBy(4 * hours, msg => msg.conversationId)
  }

  /**
   * Matches all urls in the message, passes the urls to the handler afterwards
   * TODO: add routeMatch option that takes form `/foo/:param/foo`
   */
  url = ({
    host,
    pathname,
    pathLike,
    pathContains,
    pathStartsWith,
  }: {
    host: string
    pathname?: string
    pathLike?: RegExp
    pathContains?: string
    pathStartsWith?: string
  }) =>
    this.append(msg => {
      const wwwHost = `www.${host}`
      let urls = msg.URLs.filter(
        u => u.url.host === host || u.url.host === wwwHost,
      )

      if (pathname) {
        urls = urls.filter(u => u.url.pathname === pathname)
      }

      if (pathLike) {
        urls = urls
          .map(u => {
            const m = u.url.pathname.match(pathLike)

            if (m) {
              return {
                ...u,
                pathMatch: m,
              }
            }
          })
          .filter(notEmpty)
      }

      if (pathContains) {
        urls = urls.filter(u => u.url.pathname.indexOf(pathContains) !== -1)
      }

      if (pathStartsWith) {
        urls = urls.filter(u => u.url.pathname.indexOf(pathStartsWith) === 0)
      }

      if (urls.length) {
        return urls
      }
    })

  /**
   * Creates a new matcher with new logic added to the existing chain.
   */
  private append(fn: MatcherFunc) {
    return new Matcher(...this.baseMatchers, fn)
  }

  /**
   * The method used to see if the given message matches the current chain of matchers.
   * Should only be used internally to framework.
   */
  _matchMessage(
    msg: Message,
    results: any[] = [],
  ): { matched: boolean; results: any[] } {
    // Loop though each matcher included in the chain, each matcher is a function
    for (let matcher of this.baseMatchers) {
      // Any output of the matcher, eg for regex the matching array or true/false for most
      let val = matcher(msg)

      // Matchers return an object of a specific type, if it's already in that format
      // continue into basic logic. This is likely a matcher that contains nested other
      // matchers like the `or` or `and` matcher.
      if (isMatcherResult(val)) {
        if (!val.matched) {
          // Not matched so bail out, no more matchers should be used
          return val
        } else {
          // Give the results to the handler and continue to the next matcher
          results.push(val.results)
        }
      } else {
        // If it's not already a matcher format it's a raw value, convert that raw
        // value into a matcher result.

        // If falsy bail out, don't process anymore matchers in the chain
        if (val === false || val === undefined || val === null) {
          return {
            matched: false,
            results,
          }
        }

        // If it's matched and there's no other info then the handler doesn't need
        // it in the results, so just continue on without adding it but not failing.
        if (val === true) {
          continue
        }

        // Value is some object so we want to return it to the handler
        results.push(val)
      }
    }

    return {
      matched: true,
      results,
    }
  }
}
