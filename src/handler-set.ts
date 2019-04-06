import { Message } from './message'
import { Matcher } from './matcher'
import { OutboundMessage } from './responses/outbound-message'
import { EphemoralReply } from './responses/ephemoral-reply'
import { Reply } from './responses/reply'
import { Shitbot } from '.'

function slackStringifyError(foo: any) {
  let str = `There was a problem with your response:
> ${foo}`
  if (typeof foo === 'string') return str

  return `${str}
\`\`\`
${JSON.stringify(foo)}
\`\`\``
}

function isPromise<T>(thing: Promise<T> | any): thing is Promise<T> {
  return thing instanceof Promise
}

function notNull<T>(thing: T | void | undefined | null): thing is T {
  return thing !== undefined && thing !== null
}

export type MessageHandler = (
  msg: Message,
  ...results: any[]
) => OutboundMessage | void | null | undefined | string

export class HandlerSet {
  private handlers: { matcher: Matcher; handler: MessageHandler }[] = []

  add(matcher: Matcher, handler: MessageHandler) {
    this.handlers.push({
      matcher,
      handler,
    })
  }

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
