import { RandomAccessSet } from './random-access-set'

export class EmojiLetterMap {
  readonly map: { [k: string]: RandomAccessSet<string> }
  constructor(map: { [k: string]: string[][] | string[] }) {
    this.map = {}

    for (let k in map) {
      if (k.length !== 1) {
        throw `Key ${JSON.stringify(k)} is invalid, must be single character`
      }

      let checkValues = map[k]

      const values =
        checkValues[0] instanceof String
          ? [checkValues as string[]]
          : (checkValues as string[][])

      this.map[k] = new RandomAccessSet<string>(...values)
    }
  }

  emojisForWord(word: string) {
    const characters = word.toLowerCase().split('')

    const charsUsed: { [k: string]: boolean } = {}

    const emojis = characters.map(char => {
      const emojis = this.map[char] || new RandomAccessSet<string>()
      const emoji = emojis.next()

      charsUsed[char] = true

      if (!emoji) throw `no emoji found for \`${char}\` cannot build response`

      return emoji
    })

    for (let key in charsUsed) {
      if (this.map[key]) this.map[key].reset()
    }

    return emojis
  }
}
