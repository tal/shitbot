import { Shitbot } from './shitbot'
import { RTMReactionAddedEvent } from './types'
import { User } from './workspace-data/manager'
import { Message } from './message'
import { normalizeEmoji } from './utils'

export class ReactionAdded {
  /**
   * The emoji name of te reaction added
   */
  public readonly emoji: string

  /**
   * The skin tone used on the reaction if applicable
   */
  public readonly skinTone?: string

  constructor(
    readonly bot: Shitbot,
    private readonly data: RTMReactionAddedEvent,
    readonly byUser?: User,
    readonly message?: Message,
  ) {
    const { emoji, skinTone } = normalizeEmoji(data.reaction)

    this.emoji = emoji
    this.skinTone = skinTone
  }

  /**
   * The timestamp the reaction was done, often used as the identifier for the message
   */
  get ts() {
    return this.data.ts
  }

  get byUserId() {
    return this.data.user
  }

  static async build(bot: Shitbot, data: RTMReactionAddedEvent) {
    const user = await bot.data.user(data.user)

    // The item on the reaction doesn't include the content, just meta about the content, so fetch the item itself.
    const messageData = await bot.web.conversations
      .history({
        limit: 1,
        inclusive: true,
        channel: data.item.channel,
        latest: data.item.ts,
      })
      .then(response => {
        if (response.error) {
          throw `Error with conversations.history ${response.error}`
        }

        const firstMessage = (response as any).messages[0] as
          | any // TODO: get an appropriate type for this
          | undefined

        if (firstMessage) {
          return {
            ...firstMessage,
            channel: data.item.channel,
          }
        }
      })

    let message: Message | undefined
    if (messageData) {
      message = await Message.build(bot, messageData)
    }

    return new ReactionAdded(bot, data, user, message)
  }
}
