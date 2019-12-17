import { OutboundMessage } from './outbound-message'
import { Reply, MessageConvertible } from './reply'
import { Attachment } from '../types'
import { Message } from '../message'
import { Shitbot } from '../shitbot'

/**
 * A helper that posts a new message and then replies to
 * that original message with other messages.
 */
export class ReplyWithThread extends OutboundMessage {
  private primary: MessageConvertible
  private thread: MessageConvertible[]
  private message: Message | Attachment

  /**
   * A helper that posts a new message and then replies to
   * that original message with other messages.
   *
   * @param message The seed message to reply to
   * @param primary The primary message tos end back
   * @param thread  An array of messages to reply to the newly created message with
   */
  constructor(
    message: Message | Attachment,
    primary: MessageConvertible,
    thread: MessageConvertible[],
  ) {
    if (message instanceof Message) {
      super(message.conversationId)
    } else {
      super(message.channel_id)
    }

    this.message = message
    this.primary = primary
    this.thread = thread
  }

  async doIt(bot: Shitbot) {
    const response = await new Reply(this.message, this.primary).doIt(bot)

    if (response.ok) {
      const ts = (response as any).ts as string

      return this.thread.map(t => new Reply(this.message, t, ts).doIt(bot))
    } else {
      throw "couldn't post first message"
    }
  }
}
