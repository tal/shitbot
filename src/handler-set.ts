import { Message } from './message'
import { Matcher } from './matcher'
import { OutboundMessage } from './responses/outbound-message'
import { EphemeralReply } from './responses/ephemeral-reply'
import { Reply } from './responses/reply'
import { Shitbot } from './shitbot'
import { ReactionAdded } from './reaction-added'
import { notEmpty } from './utils'

/**
 * Converts error into something that can be returned to slack.
 */
function slackStringifyError(foo: any) {
  let str = `There was a problem with your response:
> ${foo}`
  if (typeof foo === 'string') return str

  return `${str}
\`\`\`
${JSON.stringify(foo)}
\`\`\``
}

export type HandlerResult =
  | OutboundMessage
  | string
  | void
  | null
  | undefined
  | HandlerResult[]

export type MessageHandler = (
  msg: Message,
  ...results: any[]
) => Promise<HandlerResult> | HandlerResult

export type ReactionMessageHandler = (
  msg: Message,
  reaction: ReactionAdded,
  ...results: any[]
) => Promise<HandlerResult> | HandlerResult

type ReactionMatcher = string | string[] | RegExp

function reactionMatcherMatches(matcher: ReactionMatcher, reaction: string) {
  if (matcher instanceof RegExp) {
    const m = reaction.match(matcher)
    if (m) {
      return m
    }
  } else if (matcher instanceof Array) {
    return matcher.find(m => m === reaction)
  } else if (matcher === reaction) {
    return matcher
  }
}

export class HandlerSet {
  private handlers: { matcher: Matcher; handler: MessageHandler }[] = []
  private fallthroughHandlers: {
    matcher: Matcher
    handler: MessageHandler
  }[] = []
  private reactionHandlers: {
    reaction: ReactionMatcher
    matcher: Matcher
    handler: MessageHandler
  }[] = []

  /**
   * Add a handler for a given matcher to the current set of bot handlers.
   * There's currently no way to remove one after adding.
   *
   * @param matcher Something that inherits from `Matcher` that indicates when the handler should run
   * @param handler A function to handle when the matcher is triggered, can be an async function or return a promise.
   */
  add(matcher: Matcher, handler: MessageHandler) {
    this.handlers.push({
      matcher,
      handler,
    })
  }

  addFallthrough(matcher: Matcher, handler: MessageHandler) {
    this.fallthroughHandlers.push({
      matcher,
      handler,
    })
  }

  addForReaction(
    reaction: string | string[] | RegExp,
    matcher: Matcher,
    handler: ReactionMessageHandler,
  ) {
    this.reactionHandlers.push({
      reaction,
      matcher,
      handler,
    })
  }

  /**
   * Get all the responses for a given message and send them to the bot
   */
  async handle(bot: Shitbot, message: Message, results: any[] = []) {
    let { responses, wasMatched } = await this.responses({ message, results })

    if (!wasMatched) {
      responses = (
        await this.responses({
          message,
          results,
          handlers: this.fallthroughHandlers,
        })
      ).responses
    }

    return this.sendResponses(bot, message, responses)
  }

  async handleReaction(bot: Shitbot, reaction: ReactionAdded) {
    const { message } = reaction
    if (!message) {
      return Promise.resolve([])
    }

    const matchedReaction = this.reactionHandlers
      .map(matcher => {
        const { reaction: test } = matcher

        const matched = reactionMatcherMatches(test, reaction.emoji)
        if (matched) {
          return {
            matched,
            matcher,
          }
        }
      })
      .filter(notEmpty)

    const responses = await Promise.all(
      matchedReaction.map(({ matcher }) =>
        this.responses({
          message,
          handlers: [matcher],
          results: [reaction],
        }).then(({ responses }) => responses),
      ),
    )

    const flattenedResponses = responses.reduce((p, c) => [...p, ...c], [])

    return this.sendResponses(bot, message, flattenedResponses)
  }

  /**
   * Get all the responses that should be sent for a given message
   */
  private async responses({
    message,
    results: externalResults = [],
    handlers = this.handlers,
  }: {
    message: Message
    results?: any[]
    handlers?: {
      matcher: Matcher
      handler: MessageHandler
    }[]
  }) {
    let wasMatched = false
    let promises = handlers.map(({ matcher, handler }) => {
      const { matched, results } = matcher._matchMessage(message)

      if (!matched) return
      wasMatched = true

      return this.dealWithIt(handler, message, [...externalResults, ...results])
    })

    let responses: OutboundMessage[] = []
    for (let promise of promises) {
      const val = await promise

      if (!val) continue
      responses = responses.concat(val)
    }

    return { responses, wasMatched }
  }

  async sendResponses(
    bot: Shitbot,
    message: Message,
    responses: OutboundMessage[],
  ) {
    for (const response of responses) {
      try {
        await response.doIt(bot)
      } catch (error) {
        await new EphemeralReply(message, slackStringifyError(error)).doIt(bot)
      }
    }

    return responses
  }

  /**
   * Run the handler because the matcher has found to be true
   *
   * @param handler
   * @param message
   * @param results The results from the matcher if applicable
   */
  private async dealWithIt(
    handler: MessageHandler,
    message: Message,
    results: any[],
  ): Promise<OutboundMessage[]> {
    const response = await handler(message, ...results)

    return buildArrayFromHandlerResult(message, response)
  }
}

function buildArrayFromHandlerResult(
  message: Message,
  response: HandlerResult,
): OutboundMessage[] {
  if (response instanceof OutboundMessage) {
    return [response]
  } else if (response instanceof Array) {
    return response.map(r => buildArrayFromHandlerResult(message, r)[0])
  } else if (response) {
    let reply = message.reply(response)
    return [reply]
  } else {
    return []
  }
}
