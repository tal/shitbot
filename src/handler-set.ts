import { Message } from './message'
import { Matcher } from './matcher'
import { OutboundMessage } from './responses/outbound-message'
import { EphemoralReply } from './responses/ephemoral-reply'
import { Reply } from './responses/reply'
import { Shitbot } from '.'

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

export type HandlerResult = OutboundMessage | string | void | null | undefined

export type MessageHandler = (
  msg: Message,
  ...results: any[]
) => Promise<HandlerResult> | HandlerResult

export class HandlerSet {
  private handlers: { matcher: Matcher; handler: MessageHandler }[] = []

  /**
   * Add a handler for a given matcher to the current set of bot handlers.
   * There's currently no way to remove one after adding.
   *
   * @param matcher Something that inherits from `Matcher` that indicates when the handler should run
   * @param handler A function to handle when the matcher is triggred, can be an async function or return a promise.
   */
  add(matcher: Matcher, handler: MessageHandler) {
    this.handlers.push({
      matcher,
      handler,
    })
  }

  /**
   * Get all the responses for a given message and send them to the bot
   */
  async handle(bot: Shitbot, message: Message) {
    const responses = await this.responses(message)

    await Promise.all(
      responses.map(async response => {
        try {
          await response.doIt(bot)
        } catch (error) {
          new EphemoralReply(message, slackStringifyError(error)).doIt(bot)
        }
      }),
    )

    return responses
  }

  /**
   * Get all the responses that should be sent for a given message
   */
  private async responses(message: Message) {
    let promises = this.handlers.map(({ matcher, handler }) => {
      const { matched, results } = matcher._matchMessage(message)

      if (!matched) return

      return this.dealWithit(handler, message, results)
    })

    const responses: OutboundMessage[] = []
    for (let promise of promises) {
      const val = await promise

      if (!val) continue
      responses.push(val)
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
  private async dealWithit(
    handler: MessageHandler,
    message: Message,
    results: any[],
  ): Promise<OutboundMessage | undefined> {
    const response = await handler(message, ...results)
    if (response instanceof OutboundMessage) {
      return response
    } else if (response) {
      let reply = new Reply(message, response)
      return reply
    }
  }
}
