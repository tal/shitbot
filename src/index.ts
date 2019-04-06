import { RTMClient } from '@slack/rtm-api'
import { WebClient, LogLevel } from '@slack/web-api'

import { Message } from './message'
import { Manager } from './workspace-data/manager'
import { RTMMessageEvent } from './types'
import { HandlerSet, MessageHandler } from './handler-set'
import { EmojiLetterMap } from './emoji-letter-map'
import { RandomAccessSet } from './random-access-set'
import { RoundRobinSet } from './round-robin-set'
import { Matcher } from './matcher'

const all = new Matcher()

export {
  RandomAccessSet,
  RoundRobinSet,
  all,
  MessageHandler, // Mainly for typings
  Matcher, // Mainly for typings
}

export class Shitbot {
  readonly rtm: RTMClient
  readonly web: WebClient
  readonly data: Manager
  private _emojiLetters?: EmojiLetterMap
  private readonly handlers: HandlerSet

  constructor(token?: string) {
    if (!token) throw 'Non-empty token required'

    this.rtm = new RTMClient(token, { logLevel: LogLevel.DEBUG })
    this.web = new WebClient(token, { logLevel: LogLevel.DEBUG })
    this.data = new Manager(this.web)
    this.handlers = new HandlerSet()
  }

  async start(cb?: (msg: Message) => void) {
    await this.data.ensureAllTalky().then(() => this.rtm.start())

    this.rtm.on('message', async (_msg: RTMMessageEvent) => {
      if (
        (_msg.subtype && _msg.subtype === 'bot_message') ||
        (!_msg.subtype && _msg.user === this.rtm.activeUserId) ||
        // Don't handle thread messages yet
        (_msg.subtype && _msg.subtype === 'message_replied')
      ) {
        return
      }

      const msg = await Message.build(this, _msg)

      if (cb) {
        cb(msg)
      }
      this.handlers.handle(this, msg)
    })
  }

  get emojiLetters() {
    return this._emojiLetters
  }

  setEmojiLetters(val: { [k: string]: string[][] | string[] }) {
    this._emojiLetters = new EmojiLetterMap(val)
  }

  handle(matcher: Matcher, handler: MessageHandler) {
    this.handlers.add(matcher, handler)
  }
}
