import { OutboundMessage } from './outbound-message'
import { Message } from '../message'
import { Attachment } from '../types'
import { timeout } from '../utils'
import { Shitbot } from '../shitbot'

export class EmojisReaction extends OutboundMessage {
  threadTs: string
  emojis: string[] | ((bot: Shitbot) => string[])

  constructor(
    message: Message | Attachment,
    emojis: string[] | ((bot: Shitbot) => string[]),
  ) {
    if (message instanceof Message) {
      super(message.conversationId)
      this.threadTs = message.ts
    } else {
      super(message.channel_id)
      this.threadTs = message.ts
    }

    this.emojis = emojis
  }

  async doIt(bot: Shitbot) {
    let emojis: string[]

    if (this.emojis instanceof Array) {
      emojis = this.emojis
    } else {
      emojis = this.emojis(bot)
    }

    for (let emoji of emojis) {
      try {
        await bot.web.reactions.add({
          name: emoji,
          channel: this.conversationId,
          timestamp: this.threadTs,
        })
      } catch (error) {
        throw `error making reaction for \`${emoji}\``
      }

      await timeout(50) // just try not to spam servers
    }
  }
}
