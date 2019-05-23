/** ms in a second */
export const seconds = 1000
/** ms in a minute */
export const minutes = 1000 * 60
/** ms in an hour */
export const hours = 1000 * 60 * 60
/** ms in a day */
export const days = 1000 * 60 * 60 * 24

/**
 * Wrapper around `setTimeout` that converts it to a promise
 *
 * @param ms Milliseconds to wait to resolve promise.
 */
export function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isPromise<T>(thing: Promise<T> | any): thing is Promise<T> {
  return thing instanceof Promise
}

export function notNull<T>(thing: T | void | undefined | null): thing is T {
  return thing !== undefined && thing !== null
}

export const notEmpty = notNull

/**
 * Separates the skin tone from the emoji if neccisary. Also accepts
 * emoji that start with `:` or not (for reactions)
 */
export function normalizeEmoji(
  emoji: string,
): { emoji: string; skinTone?: string } {
  if (emoji[0] === ':') {
    emoji = emoji.substr(1, emoji.length - 2)
  }

  const idx = emoji.indexOf('::skin-tone')
  if (idx === -1) {
    return {
      emoji: emoji,
      skinTone: undefined,
    }
  } else {
    return {
      emoji: emoji.substring(0, idx),
      skinTone: emoji.substring(idx + 2),
    }
  }
}

export function allMatches(str: string, regex: RegExp) {
  let m: ReturnType<RegExp['exec']>

  const matches: RegExpExecArray[] = []

  do {
    m = regex.exec(str)
    if (m) {
      matches.push(m)
    }
  } while (m)

  return matches
}

export function allSlackURLs(text: string) {
  return allMatches(text, /\<(http.+?)(?:\|(.+?))?\>/g)
}
