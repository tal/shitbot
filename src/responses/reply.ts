import { Message } from '../message'
import { OutboundMessage } from './outbound-message'
import { MessageAttachment, KnownBlock } from '@slack/web-api'
import { Attachment } from '../types'
import { Shitbot } from '..'

interface MessagePayload {
  text?: string
  attachments?: MessageAttachment[]
  blocks?: KnownBlock[]
}

export type MessageConveratable =
  | string
  | MessageAttachment
  | MessageAttachment[]
  | MessagePayload

function isMessagePayload(obj: MessageConveratable): obj is MessagePayload {
  return (
    typeof obj !== 'string' &&
    ('text' in obj || 'attachments' in obj || 'blocks' in obj)
  )
}

function payload(value: MessageConveratable): MessagePayload {
  if (isMessagePayload(value)) {
    return value
  } else if (typeof value === 'string') {
    return {
      text: value,
    }
  } else if (value instanceof Array) {
    return {
      attachments: value,
    }
  } else {
    return {
      attachments: [value],
    }
  }
}

export class Reply extends OutboundMessage {
  public payload: MessagePayload
  public threadTS: string | undefined

  constructor(
    message: Message | Attachment,
    text: MessageConveratable,
    threadTS?: string,
  ) {
    if (message instanceof Message) {
      super(message.conversationId)
    } else {
      super(message.channel_id)
    }

    this.threadTS = threadTS
    this.payload = payload(text)
  }

  async doIt(bot: Shitbot) {
    const payload = {
      channel: this.conversationId,
      text: '',
      ...this.payload,
      as_user: true,
      thread_ts: this.threadTS,
    }

    let resp = await bot.web.chat.postMessage(payload)
    return resp
  }
}
