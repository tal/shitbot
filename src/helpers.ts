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
