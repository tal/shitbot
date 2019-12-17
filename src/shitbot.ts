import { RTMClient } from '@slack/rtm-api'
import { WebClient } from '@slack/web-api'
import { LogLevel, ConsoleLogger, Logger } from '@slack/logger'

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

  readonly logger: Logger = new ConsoleLogger()

  constructor(
    token?: string, // Is optional to allow passing of env var directly
    {
      logLevel = LogLevel.INFO,
      rtmLogLevel,
      webLogLevel,
    }: {
      logLevel?: LogLevel
      rtmLogLevel?: LogLevel
      webLogLevel?: LogLevel
    } = {},
  ) {
    if (!token) throw 'Non-empty token required'

    this.logger.setName('shitbot')
    this.logger.setLevel(logLevel)
    this.rtm = new RTMClient(token, { logLevel: rtmLogLevel ?? logLevel })
    this.web = new WebClient(token, { logLevel: webLogLevel ?? logLevel })
    this.data = new Manager(this.web, { logLevel })
    this.handlers = new HandlerSet()
  }

  async start(cb?: () => void) {
    const { self, team } = await this.data
      .primeStores()
      .then(() => this.rtm.start() as any)

    if (cb) cb()

    this.logger.info(
      `📶 connected as ${self.name} to workspace ${team.name} (${team.domain}.slack.com)`,
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
