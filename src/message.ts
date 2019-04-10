import { RTMMessageEvent } from './types'
import { User, Channel, IM } from './workspace-data/manager'
import { Reply, MessageConveratable } from './responses/reply'
import { EmojiWordReaction } from './responses/emoji-word-reaction'
import { EmojisReaction } from './responses/emojis-reaction'
import { EphemoralReply } from './responses/ephemoral-reply'
import { Shitbot } from '.'

const mentionRegex = /^\<\@(\w+)\>:?\s*(.*)/i

/**
 * A wrapper for the bare message object provided by the API. Provides
 * helpers to get channel and user names instead of just ids as well as other
 * helpufl methods.
 */
export class Message {
  constructor(
    readonly bot: Shitbot,
    private readonly data: RTMMessageEvent,
    readonly user: User | undefined,
    readonly channel: Channel | undefined,
    readonly im: IM | undefined,
  ) {}

  /**
   * The timestamp the message was sent, often used as the identifier for the message
   */
  get ts() {
    return this.data.ts
  }

  /**
   * The ID of the user who sent the message.
   */
  get userID() {
    return this.data.user
  }

  /**
   * The username of the person who sent the message.
   */
  get userName() {
    if (this.user) return this.user.name
  }

  /**
   * The name of the channel the message was sent in, if present.
   * Does not include a prefixed `#`
   */
  get channelName() {
    if (this.channel && this.channel.name) {
      return this.channel.name
    }
  }

  /**
   * Retruns a regex match for a mention that the line starts with
   */
  private get mentionMatch() {
    if (!this.data.text) {
      return null
    }

    return this.data.text.match(mentionRegex)
  }

  /**
   * The text content of the message, if the bot is mentioned
   * it gets the text after the mention only.
   */
  get text() {
    let match = this.mentionMatch
    if (match) {
      return match[2]
    }
    return this.data.text
  }

  /**
   * If a message is IMed to the bot as a link pulls out the linked message
   * so you can act on that instead.
   */
  private get sharedMessage() {
    if (this.im && this.data.attachments) {
      let attachment = this.data.attachments[0]
      if (attachment && attachment.is_share) {
        return attachment
      }
    }
  }

  /**
   * If the message is actually a share, show the shared message, if not it
   * returns self so that you can act on that.
   */
  private get sharedMessageOrSelf() {
    return this.sharedMessage || this
  }

  /**
   * If the bot is `@mentioned` (must be at beginning of message)
   */
  get mentionedBot() {
    const m = this.mentionMatch
    if (!m) return false

    return m[1] === this.bot.rtm.activeUserId
  }

  /**
   * If the bot is `@mentioned` or if it's in an IM.
   */
  get directedAtBot() {
    if (this.im) {
      return true
    }

    return this.mentionedBot
  }

  /**
   * The id for where the message was sent, channel, im, or whatever
   */
  get conversationId() {
    return this.data.channel
  }

  /**
   * Trigger a response that says the bot is typing a response.
   */
  typingResponse() {
    this.bot.rtm.sendTyping(this.conversationId)
  }

  /**
   * Send a simple text response to the sent message.
   */
  reply(text: MessageConveratable) {
    return new Reply(this.sharedMessageOrSelf, text)
  }

  /**
   * Write a word using emoji reactions to the word.
   */
  emojiWordReaction(word: string) {
    return new EmojiWordReaction(this.sharedMessageOrSelf, word)
  }

  /**
   * Send an emoji reaction to the message
   * @param emojis a list of the string equivalent to the emojis to send (what's inside the `:`)
   */
  emojiReaction(...emojis: string[]) {
    return new EmojisReaction(this.sharedMessageOrSelf, emojis)
  }

  /**
   * Sends a reply to the message as an ephemoral message (visible only to targeted user).
   */
  ephemporalResponse(text: string) {
    return new EphemoralReply(this, text)
  }

  /**
   * Replies to the message given but in a thread instead of in the channel.
   */
  replyThread(text: MessageConveratable) {
    return new Reply(
      this.sharedMessageOrSelf,
      text,
      this.sharedMessageOrSelf.ts,
    )
  }

  /**
   * Helper initializer to get all the valid data from a source message
   * @param bot
   * @param data The data from the API to form the message
   */
  static async build(bot: Shitbot, data: RTMMessageEvent) {
    const user = await bot.data.user(data.user)
    const channel = await bot.data.channel(data.channel)
    const im = await bot.data.im(data.channel)
    return new Message(bot, data, user, channel, im)
  }
}
