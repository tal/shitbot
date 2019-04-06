import { RTMMessageEvent } from './types'
import { User, Channel, IM } from './workspace-data/manager'
import { Reply, MessageConveratable } from './responses/reply'
import { EmojiWordReaction } from './responses/emoji-word-reaction'
import { EmojisReaction } from './responses/emojis-reaction'
import { EphemoralReply } from './responses/ephemoral-reply'
import { Shitbot } from '.'

const mentionRegex = /^\<\@(\w+)\>:?\s*(.*)/i

export class Message {
  constructor(
    readonly bot: Shitbot,
    private readonly data: RTMMessageEvent,
    readonly user: User | undefined,
    readonly channel: Channel | undefined,
    readonly im: IM | undefined,
  ) {}

  get ts() {
    return this.data.ts
  }

  get userID() {
    return this.data.user
  }

  get userName() {
    if (this.user) return this.user.name
  }

  get channelName() {
    if (this.channel && this.channel.name) {
      return this.channel.name
    }
  }

  private get mentionMatch() {
    if (!this.data.text) {
      return null
    }

    return this.data.text.match(mentionRegex)
  }

  get text() {
    let match = this.mentionMatch
    if (match) {
      return match[2]
    }
    return this.data.text
  }

  private get sharedMessage() {
    if (this.im && this.data.attachments) {
      let attachment = this.data.attachments[0]
      if (attachment && attachment.is_share) {
        return attachment
      }
    }
  }

  private get sharedMessageOrSelf() {
    return this.sharedMessage || this
  }

  get mentionedBot() {
    const m = this.mentionMatch
    if (!m) return false

    return m[1] === this.bot.rtm.activeUserId
  }

  get directedAtBot() {
    if (this.im) {
      return true
    }

    return this.mentionedBot
  }

  get conversationId() {
    return this.data.channel
  }

  typingResponse() {
    this.bot.rtm.sendTyping(this.conversationId)
  }

  reply(text: MessageConveratable) {
    return new Reply(this.sharedMessageOrSelf, text)
  }

  emojiWordReaction(word: string) {
    return new EmojiWordReaction(this.sharedMessageOrSelf, word)
  }

  emojiReaction(...emojis: string[]) {
    return new EmojisReaction(this.sharedMessageOrSelf, emojis)
  }

  ephemporalResponse(text: string) {
    return new EphemoralReply(this, text)
  }

  replyThread(text: MessageConveratable) {
    return new Reply(
      this.sharedMessageOrSelf,
      text,
      this.sharedMessageOrSelf.ts,
    )
  }

  static async build(bot: Shitbot, data: RTMMessageEvent) {
    const user = await bot.data.user(data.user)
    const channel = await bot.data.channel(data.channel)
    const im = await bot.data.im(data.channel)
    return new Message(bot, data, user, channel, im)
  }
}
