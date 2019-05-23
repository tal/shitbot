import { RTMClient } from '@slack/rtm-api'
import { WebClient, LogLevel } from '@slack/web-api'

import { Message } from './message'
import { Manager } from './workspace-data/manager'
import { RTMMessageEvent, RTMReactionAddedEvent } from './types'
import { HandlerSet, MessageHandler } from './handler-set'
import { EmojiLetterMap } from './emoji-letter-map'
import { RandomAccessSet } from './random-access-set'
import { RoundRobinSet } from './round-robin-set'
import { Matcher } from './matcher'
import { ReactionAdded } from './reaction-added'
import { Reply } from './responses/reply'
import { ReplyWithThread } from './responses/reply-with-thread'
import { EphemoralReply } from './responses/ephemoral-reply'

const all = new Matcher()

export {
  RandomAccessSet,
  RoundRobinSet,
  all,
  MessageHandler, // Mainly for typings
  Matcher, // Mainly for typings
  Reply,
  ReplyWithThread,
  EphemoralReply,
}

export class Shitbot {
  readonly rtm: RTMClient
  readonly web: WebClient
  readonly data: Manager
  private _emojiLetters?: EmojiLetterMap
  private readonly handlers: HandlerSet

  constructor(token?: string) {
    if (!token) throw 'Non-empty token required'

    this.rtm = new RTMClient(token, { logLevel: LogLevel.ERROR })
    this.web = new WebClient(token, { logLevel: LogLevel.ERROR })
    this.data = new Manager(this.web)
    this.handlers = new HandlerSet()
  }

  async start(cb?: (msg: Message) => void) {
    const { self, team } = await this.data
      .ensureAllTalky()
      .then(() => this.rtm.start() as any)

    console.log(
      `📶 shitbot connected as ${self.name} to workspace ${team.name} (${
        team.domain
      }.slack.com)`,
    )

    this.rtm.on('reaction_added', async (_msg: RTMReactionAddedEvent) => {
      const reaction = await ReactionAdded.build(this, _msg)

      this.handlers.handleReaction(this, reaction)
    })

    this.rtm.on('message', async (_msg: RTMMessageEvent) => {
      if (_msg.subtype) {
        switch (_msg.subtype) {
          case 'bot_message':
          case 'message_deleted':
          // TODO: support replies
          case 'message_replied':
            return
        }
      }
      if (_msg.user === this.rtm.activeUserId) {
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

  onReaction(...args: Parameters<HandlerSet['addForReaction']>) {
    this.handlers.addForReaction(...args)
  }
}
