export function notEmpty<T>(value: T | null | undefined | void): value is T {
  return value !== null && value !== undefined
}

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
