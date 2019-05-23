import { Message } from '../message'
import { OutboundMessage } from './outbound-message'
import { Shitbot } from '../shitbot'

export class EphemoralReply extends OutboundMessage {
  toUser: string
  public text: string

  constructor(message: Message, text: string) {
    let userID: string | undefined

    super(message.conversationId)
    if (message.user) userID = message.user.id

    if (userID) {
      this.toUser = userID
    } else {
      throw 'user on message is required to send ephemoral reply'
    }

    this.text = text
  }

  async doIt(bot: Shitbot) {
    await bot.web.chat.postEphemeral({
      channel: this.conversationId,
      text: this.text,
      user: this.toUser,
      as_user: true,
    })
  }
}
