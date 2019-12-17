import { RTMClient } from '@slack/rtm-api'
import { WebClient, LogLevel } from '@slack/web-api'

import { Manager } from './workspace-data/manager'
import { HandlerSet, MessageHandler } from './handler-set'
import { EmojiLetterMap } from './emoji-letter-map'
import { Message } from './message'
import { RTMReactionAddedEvent, RTMMessageEvent } from './types'
import { ReactionAdded } from './reaction-added'
import { Matcher } from './matcher'

export class Shitbot {
  readonly rtm: RTMClient
  readonly web: WebClient
  readonly data: Manager
  private _emojiLetters?: EmojiLetterMap
  private readonly handlers: HandlerSet

  readonly logLevel: LogLevel

  constructor(
    token?: string, // Is optional to allow passing of env var directly
    { logLevel = LogLevel.INFO }: { logLevel?: LogLevel } = {},
  ) {
    if (!token) throw 'Non-empty token required'

    this.logLevel = logLevel
    this.rtm = new RTMClient(token, { logLevel })
    this.web = new WebClient(token, { logLevel })
    this.data = new Manager(this.web)
    this.handlers = new HandlerSet()
  }

  async start(cb?: () => void) {
    const { self, team } = await this.data
      .ensureAllTalky()
      .then(() => this.rtm.start() as any)

    if (cb) cb()

    if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO) {
      console.log(
        `📶 shitbot connected as ${self.name} to workspace ${team.name} (${team.domain}.slack.com)`,
      )
    }

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

  fallthrough(matcher: Matcher, handler: MessageHandler) {
    this.handlers.addFallthrough(matcher, handler)
  }

  onReaction(...args: Parameters<HandlerSet['addForReaction']>) {
    this.handlers.addForReaction(...args)
  }
}
