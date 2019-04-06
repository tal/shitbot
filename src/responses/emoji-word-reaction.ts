import { EmojisReaction } from './emojis-reaction'
import { Message } from '../message'
import { Attachment } from '../types'
import { Shitbot } from '..'

export class EmojiWordReaction extends EmojisReaction {
  constructor(message: Message | Attachment, word: string) {
    super(message, (bot: Shitbot) => {
      const emojiLetterMap = bot.emojiLetters
      if (emojiLetterMap) {
        return emojiLetterMap.emojisForWord(word)
      } else {
        throw `Add emoji letters to bot to have emoji word reaction`
      }
    })
  }
}
